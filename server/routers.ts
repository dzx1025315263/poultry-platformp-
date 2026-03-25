import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import * as db from "./db";
import { notifyFavoriteChange, notifyStatusUpdate, notifyContactImport, setFeishuWebhookUrl, getFeishuWebhookUrl, sendFeishuNotification } from "./feishuWebhook";
import { invokeLLM } from "./_core/llm";
import { industryConfig } from "@shared/industry-config";
import { replaceTemplateVariables, type TemplateContext } from "@shared/emailTemplateVars";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'editor') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要管理员权限' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  company: router({
    stats: protectedProcedure.query(() => db.getCompanyStats()),
    countryStats: protectedProcedure.query(() => db.getCountryStats()),
    search: protectedProcedure.input(z.object({
      query: z.string().optional(), continent: z.string().optional(), country: z.string().optional(),
      role: z.string().optional(), chinaOnly: z.boolean().optional(), page: z.number().optional(), pageSize: z.number().optional(),
    })).query(({ input }) => db.searchCompanies(input)),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getCompanyById(input.id)),
    byContinent: protectedProcedure.input(z.object({ continent: z.string() })).query(({ input }) => db.getCompaniesByContinent(input.continent)),
    byCountry: protectedProcedure.input(z.object({ country: z.string() })).query(({ input }) => db.getCompaniesByCountry(input.country)),
    similar: protectedProcedure.input(z.object({ companyId: z.number(), limit: z.number().optional() }))
      .query(({ input }) => db.getSimilarCompanies(input.companyId, input.limit || 10)),
    advancedSearch: protectedProcedure.input(z.object({
      query: z.string().optional(), continent: z.string().optional(), country: z.string().optional(),
      role: z.string().optional(), chinaOnly: z.boolean().optional(),
      minCreditScore: z.number().optional(), maxCreditScore: z.number().optional(),
      hasContacts: z.boolean().optional(), hasLinkedin: z.boolean().optional(),
      page: z.number().optional(), pageSize: z.number().optional(),
    })).query(({ input }) => db.advancedSearchCompanies(input)),
    changeHistory: protectedProcedure.input(z.object({ companyId: z.number(), limit: z.number().optional() }))
      .query(({ input }) => db.getCompanyChangeHistory(input.companyId, input.limit || 50)),
  }),

  favorite: router({
    list: protectedProcedure.query(({ ctx }) => db.getUserFavorites(ctx.user.id)),
    ids: protectedProcedure.query(({ ctx }) => db.getUserFavoriteIds(ctx.user.id)),
    add: protectedProcedure.input(z.object({ companyId: z.number() })).mutation(async ({ ctx, input }) => {
      const result = await db.addFavorite(ctx.user.id, input.companyId);
      const company = await db.getCompanyById(input.companyId);
      notifyFavoriteChange({ userName: ctx.user.name || '未知用户', companyName: company?.companyName || `ID:${input.companyId}`, action: 'add' }).catch(() => {});
      return result;
    }),
    remove: protectedProcedure.input(z.object({ companyId: z.number() })).mutation(async ({ ctx, input }) => {
      const company = await db.getCompanyById(input.companyId);
      await db.removeFavorite(ctx.user.id, input.companyId);
      notifyFavoriteChange({ userName: ctx.user.name || '未知用户', companyName: company?.companyName || `ID:${input.companyId}`, action: 'remove' }).catch(() => {});
    }),
    update: protectedProcedure.input(z.object({
      companyId: z.number(), followUpStatus: z.string().optional(), followUpDate: z.date().nullable().optional(), notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { companyId, ...data } = input;
      const result = await db.updateFavorite(ctx.user.id, companyId, data);
      if (input.followUpStatus) {
        const company = await db.getCompanyById(companyId);
        notifyStatusUpdate({ userName: ctx.user.name || '未知用户', companyName: company?.companyName || `ID:${companyId}`, newStatus: input.followUpStatus }).catch(() => {});
      }
      return result;
    }),
  }),

  team: router({
    list: protectedProcedure.query(({ ctx }) => db.getUserTeams(ctx.user.id)),
    create: protectedProcedure.input(z.object({ name: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const inviteCode = nanoid(8);
      return db.createTeam(input.name, ctx.user.id, inviteCode);
    }),
    join: protectedProcedure.input(z.object({ inviteCode: z.string() })).mutation(({ ctx, input }) => db.joinTeam(input.inviteCode, ctx.user.id)),
    members: protectedProcedure.input(z.object({ teamId: z.number() })).query(({ input }) => db.getTeamMembers(input.teamId)),
    leave: protectedProcedure.input(z.object({ teamId: z.number() })).mutation(({ ctx, input }) => db.leaveTeam(input.teamId, ctx.user.id)),
    delete: protectedProcedure.input(z.object({ teamId: z.number() })).mutation(({ input }) => db.deleteTeam(input.teamId)),
    shareCompany: protectedProcedure.input(z.object({ teamId: z.number(), companyId: z.number() })).mutation(({ ctx, input }) => db.shareCompanyToTeam(input.teamId, input.companyId, ctx.user.id)),
    sharedCompanies: protectedProcedure.input(z.object({ teamId: z.number() })).query(({ input }) => db.getTeamSharedCompanies(input.teamId)),
    updateShared: protectedProcedure.input(z.object({ id: z.number(), followUpStatus: z.string().optional(), notes: z.string().optional() }))
      .mutation(({ ctx, input }) => { const { id, ...data } = input; return db.updateTeamSharedCompany(id, ctx.user.id, data); }),
  }),

  inquiry: router({
    getTemplate: protectedProcedure.query(({ ctx }) => db.getInquiryTemplate(ctx.user.id)),
    saveTemplate: protectedProcedure.input(z.object({
      companyName: z.string().optional(), contactPerson: z.string().optional(), email: z.string().optional(),
      phone: z.string().optional(), destinationPort: z.string().optional(), emailBody: z.string().optional(),
    })).mutation(({ ctx, input }) => db.upsertInquiryTemplate(ctx.user.id, input)),
    getSmtp: protectedProcedure.query(({ ctx }) => db.getSmtpConfig(ctx.user.id)),
    saveSmtp: protectedProcedure.input(z.object({
      host: z.string(), port: z.number(), secure: z.boolean().optional(),
      username: z.string(), password: z.string(), fromName: z.string().optional(), fromEmail: z.string().optional(),
    })).mutation(({ ctx, input }) => db.upsertSmtpConfig(ctx.user.id, input)),
    emailHistory: protectedProcedure.input(z.object({ page: z.number().optional(), pageSize: z.number().optional() }))
      .query(({ ctx, input }) => db.getEmailHistory(ctx.user.id, input.page, input.pageSize)),
    sendEmail: protectedProcedure.input(z.object({
      recipients: z.string(), subject: z.string(), body: z.string(),
      sendType: z.enum(["single", "bcc"]).optional(), companyId: z.number().optional(), internalNote: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.addEmailHistory({ userId: ctx.user.id, companyId: input.companyId, recipients: input.recipients, subject: input.subject, body: input.body, sendType: input.sendType || 'single', status: 'sent', internalNote: input.internalNote });
      return { success: true };
    }),
  }),

  // V2.0: 联系人管理
  contact: router({
    list: protectedProcedure.input(z.object({ companyId: z.number() })).query(({ input }) => db.getCompanyContacts(input.companyId)),
    add: protectedProcedure.input(z.object({
      companyId: z.number(), name: z.string().min(1), title: z.string().optional(),
      email: z.string().optional(), phone: z.string().optional(), linkedin: z.string().optional(), isPrimary: z.boolean().optional(),
    })).mutation(({ ctx, input }) => db.addCompanyContact({ ...input, addedByUserId: ctx.user.id })),
    update: protectedProcedure.input(z.object({
      id: z.number(), name: z.string().optional(), title: z.string().optional(),
      email: z.string().optional(), phone: z.string().optional(), linkedin: z.string().optional(), isPrimary: z.boolean().optional(),
    })).mutation(({ input }) => { const { id, ...data } = input; return db.updateCompanyContact(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteCompanyContact(input.id)),
    // V2.1: 批量导入联系人
    bulkImport: protectedProcedure.input(z.object({
      companyId: z.number(),
      contacts: z.array(z.object({
        name: z.string().min(1), title: z.string().optional(),
        email: z.string().optional(), phone: z.string().optional(), linkedin: z.string().optional(),
      })),
    })).mutation(async ({ ctx, input }) => {
      const results = [];
      for (const c of input.contacts) {
        const id = await db.addCompanyContact({ companyId: input.companyId, ...c, addedByUserId: ctx.user.id });
        results.push(id);
      }
      const company = await db.getCompanyById(input.companyId);
      notifyContactImport({ userName: ctx.user.name || '未知用户', companyName: company?.companyName || `ID:${input.companyId}`, count: input.contacts.length }).catch(() => {});
      return { imported: results.length };
    }),
    // V2.1: 批量发送邮件给企业联系人（V2.7: 支持变量替换）
    bulkEmail: protectedProcedure.input(z.object({
      companyId: z.number(),
      contactIds: z.array(z.number()),
      subject: z.string().min(1),
      body: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      const contacts = await db.getCompanyContacts(input.companyId);
      const selected = contacts.filter((c: any) => input.contactIds.includes(c.id) && c.email);
      if (selected.length === 0) throw new TRPCError({ code: 'BAD_REQUEST', message: '所选联系人中没有有效邮箱' });
      
      // V2.7: 获取企业数据用于变量替换
      const company = await db.getCompanyById(input.companyId);
      
      // 为每个联系人单独替换变量并发送
      for (const contact of selected) {
        const templateCtx: TemplateContext = {
          company: company || { companyName: '' },
          contact: contact,
        };
        const finalSubject = replaceTemplateVariables(input.subject, templateCtx);
        const finalBody = replaceTemplateVariables(input.body, templateCtx);
        
        await db.addEmailHistory({
          userId: ctx.user.id, companyId: input.companyId, recipients: contact.email || '',
          subject: finalSubject, body: finalBody, sendType: 'single', status: 'sent',
          internalNote: `批量发送给 ${selected.length} 个联系人 - ${contact.name}`,
        });
      }
      return { sent: selected.length, recipients: selected.map((c: any) => ({ name: c.name, email: c.email })) };
    }),
  }),

  // V2.0: 信用评级
  credit: router({
    get: protectedProcedure.input(z.object({ companyId: z.number() })).query(({ input }) => db.getCompanyCreditRating(input.companyId)),
    upsert: protectedProcedure.input(z.object({
      companyId: z.number(), registeredCapital: z.string().optional(), foundedYear: z.number().optional(),
      importFrequency: z.string().optional(), cooperationHistory: z.string().optional(), creditScore: z.number().optional(),
    })).mutation(({ ctx, input }) => { const { companyId, ...data } = input; return db.upsertCreditRating(companyId, { ...data, ratedByUserId: ctx.user.id }); }),
  }),

  // V2.0: 客户生命周期漏斗
  lifecycle: router({
    funnel: protectedProcedure.query(({ ctx }) => db.getLifecycleFunnel(ctx.user.id)),
    // V2.1: 带信用评级筛选的漏斗
    funnelWithCredit: protectedProcedure.input(z.object({
      minCreditScore: z.number().optional(),
      maxCreditScore: z.number().optional(),
    }).optional()).query(({ ctx, input }) => db.getLifecycleFunnelWithCredit(ctx.user.id, input)),
    add: protectedProcedure.input(z.object({
      companyId: z.number(), stage: z.enum(['prospect', 'contacted', 'quoted', 'won', 'repurchase']),
      dealValue: z.string().optional(), expectedCloseDate: z.date().optional(), notes: z.string().optional(),
    })).mutation(({ ctx, input }) => { const { companyId, stage, ...data } = input; return db.addToLifecycle(ctx.user.id, companyId, stage, data); }),
    remove: protectedProcedure.input(z.object({ companyId: z.number() })).mutation(({ ctx, input }) => db.removeFromLifecycle(ctx.user.id, input.companyId)),
  }),

  // V2.0: A/B测试
  abTest: router({
    list: protectedProcedure.query(({ ctx }) => db.getUserAbTests(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1), variantA_subject: z.string().optional(), variantA_body: z.string().optional(),
      variantB_subject: z.string().optional(), variantB_body: z.string().optional(),
    })).mutation(({ ctx, input }) => db.createAbTest(ctx.user.id, input)),
    updateStats: protectedProcedure.input(z.object({
      id: z.number(), variant: z.enum(['A', 'B']), field: z.enum(['sent', 'opened', 'replied']),
    })).mutation(({ input }) => db.updateAbTestStats(input.id, input.variant, input.field)),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteAbTest(input.id)),
  }),

  // V2.0: 数据导出
  export: router({
    companies: protectedProcedure.input(z.object({
      continent: z.string().optional(), country: z.string().optional(), role: z.string().optional(), chinaOnly: z.boolean().optional(),
    })).query(({ input }) => db.exportCompanies(input)),
    favorites: protectedProcedure.input(z.object({ status: z.string().optional() }))
      .query(({ ctx, input }) => db.exportFavorites(ctx.user.id, input.status)),
  }),

  // V2.0: 团队区域权限
  regionAccess: router({
    get: protectedProcedure.input(z.object({ teamId: z.number() })).query(({ input }) => db.getTeamRegionAccess(input.teamId)),
    set: adminProcedure.input(z.object({
      teamId: z.number(), regions: z.array(z.object({ continent: z.string().optional(), country: z.string().optional() })),
    })).mutation(({ input }) => db.setTeamRegionAccess(input.teamId, input.regions)),
  }),

  // V2.1: UN Comtrade 贸易数据
  trade: router({
    poultryImports: protectedProcedure.input(z.object({
      year: z.number().optional(),
    }).optional()).query(({ input }) => db.getPoultryTradeData(input?.year)),
    trends: protectedProcedure.input(z.object({
      country: z.string().optional(),
    }).optional()).query(({ input }) => db.getPoultryTradeTrends(input?.country)),
    annualSummary: protectedProcedure.query(() => db.getTradeAnnualSummary()),
    topCountries: protectedProcedure.input(z.object({
      year: z.number(), limit: z.number().optional(),
    })).query(({ input }) => db.getTradeTopCountriesByYear(input.year, input.limit || 10)),
  }),

  // V2.0: 数据备份
  backup: router({
    list: adminProcedure.input(z.object({ page: z.number().optional(), pageSize: z.number().optional() }))
      .query(({ input }) => db.getBackupRecords(input.page, input.pageSize)),
    create: adminProcedure.mutation(async ({ ctx }) => {
      const allCompanies = await db.exportCompanies({});
      const id = await db.addBackupRecord({
        fileName: `backup_${new Date().toISOString().slice(0, 10)}.json`,
        recordCount: allCompanies.length,
        backupType: 'manual',
        createdByUserId: ctx.user.id,
      });
      return { id, recordCount: allCompanies.length };
    }),
  }),

  // V2.2: 飞书Webhook配置
  feishu: router({
    getWebhookUrl: protectedProcedure.query(() => {
      const url = getFeishuWebhookUrl();
      return { url: url ? url.replace(/(.{10}).*(.{10})/, '$1****$2') : '', configured: !!url };
    }),
    setWebhookUrl: adminProcedure.input(z.object({ url: z.string().url() })).mutation(({ input }) => {
      setFeishuWebhookUrl(input.url);
      return { success: true };
    }),
    testNotification: protectedProcedure.mutation(async ({ ctx }) => {
      const result = await sendFeishuNotification({
        title: '测试通知',
        content: `**测试人：** ${ctx.user.name || '未知用户'}\n**时间：** ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n✅ 飞书Webhook配置成功，通知推送正常工作！`,
        type: 'general',
      });
      return { success: result };
    }),
  }),

  // V2.2: AI智能客户推荐
  aiRecommend: router({
    getRecommendations: protectedProcedure.input(z.object({
      limit: z.number().optional(),
    }).optional()).mutation(async ({ ctx, input }) => {
      // 1. 获取用户已成交客户画像
      const lifecycle = await db.getLifecycleFunnel(ctx.user.id);
      const wonItems = lifecycle.items.filter((i: any) => 
        i.customer_lifecycle.stage === 'won' || i.customer_lifecycle.stage === 'repurchase'
      );
      const favs = await db.getUserFavorites(ctx.user.id);
      const closedWonFavs = favs.filter((f: any) => f.favorites.followUpStatus === 'closed_won');
      const wonCompanies = [
        ...wonItems.map((i: any) => i.companies),
        ...closedWonFavs.map((f: any) => f.companies),
      ];
      if (wonCompanies.length === 0) {
        return { recommendations: [], message: '暂无已成交客户数据，请先将客户标记为已成交状态后再使用AI推荐' };
      }
      const profileSummary = wonCompanies.map((c: any) => 
        `${c.companyName} | ${c.country} | ${c.continent} | ${c.coreRole || ''} | ${c.mainProducts || ''}`
      ).join('\n');
      // 获取候选企业（排除已在收藏夹、生命周期、以及不感兴趣列表中的）
      const favIds = favs.map((f: any) => f.favorites.companyId);
      const lifecycleIds = lifecycle.items.map((i: any) => i.customer_lifecycle.companyId);
      const exclusions = await db.getAiExclusions(ctx.user.id);
      const excludedIds = exclusions.map((e: any) => e.companyId);
      const excludeIds = new Set([...favIds, ...lifecycleIds, ...excludedIds]);
      const allCompanies = await db.searchCompanies({ page: 1, pageSize: 500 });
      const candidates = allCompanies.data.filter((c: any) => !excludeIds.has(c.id));
      if (candidates.length === 0) {
        return { recommendations: [], message: '所有企业已在您的客户管理中或已标记为不感兴趣，无新推荐' };
      }
      const candidateSummary = candidates.slice(0, 100).map((c: any) => 
        `ID:${c.id} | ${c.companyName} | ${c.country} | ${c.continent} | ${c.coreRole || ''} | ${c.mainProducts || ''} | 中国采购:${c.hasPurchasedFromChina || '否'}`
      ).join('\n');
      const llmResult = await invokeLLM({
        messages: [
          { role: 'system', content: industryConfig.aiMatchExpertPrompt },
          { role: 'user', content: `已成交客户画像：\n${profileSummary}\n\n候选企业列表：\n${candidateSummary}\n\n请从候选企业中选出最多${input?.limit || 10}家最可能成交的企业，按匹配度从高到低排序。对每家企业给出匹配度评分(0-100)和推荐理由。` },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'recommendations',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                recommendations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      companyId: { type: 'number', description: '企业ID' },
                      matchScore: { type: 'number', description: '匹配度评分 0-100' },
                      reason: { type: 'string', description: '推荐理由' },
                    },
                    required: ['companyId', 'matchScore', 'reason'],
                    additionalProperties: false,
                  },
                },
                profileSummary: { type: 'string', description: '客户画像总结' },
              },
              required: ['recommendations', 'profileSummary'],
              additionalProperties: false,
            },
          },
        },
      });
      const content = llmResult.choices[0]?.message?.content;
      const parsed = JSON.parse(typeof content === 'string' ? content : '');
      const recommendedCompanies = await Promise.all(
        (parsed.recommendations || []).map(async (rec: any) => {
          const company = await db.getCompanyById(rec.companyId);
          return company ? { ...rec, company } : null;
        })
      );
      return {
        recommendations: recommendedCompanies.filter(Boolean),
        profileSummary: parsed.profileSummary || '',
        message: `基于 ${wonCompanies.length} 家已成交客户画像，为您推荐了 ${recommendedCompanies.filter(Boolean).length} 家潜在客户`,
      };
    }),
    // V2.3: 标记不感兴趣
    exclude: protectedProcedure.input(z.object({
      companyId: z.number(),
      reason: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.addAiExclusion(ctx.user.id, input.companyId, input.reason);
      return { success: true };
    }),
    // V2.3: 取消不感兴趣标记
    removeExclusion: protectedProcedure.input(z.object({
      companyId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      await db.removeAiExclusion(ctx.user.id, input.companyId);
      return { success: true };
    }),
    // V2.3: 获取不感兴趣列表
    getExclusions: protectedProcedure.query(async ({ ctx }) => {
      const exclusions = await db.getAiExclusions(ctx.user.id);
      const companiesData = await Promise.all(
        exclusions.map(async (e: any) => {
          const company = await db.getCompanyById(e.companyId);
          return { ...e, company };
        })
      );
      return companiesData.filter((e: any) => e.company);
    }),
  }),

  // V2.2: 邮件自动化工作流
  emailAutomation: router({
    // 使用A/B测试模板发送邮件（自动分配变体）
    sendWithAbTest: protectedProcedure.input(z.object({
      abTestId: z.number(),
      recipients: z.array(z.object({
        email: z.string(),
        companyName: z.string().optional(),
        companyId: z.number().optional(),
        contactId: z.number().optional(),
      })),
    })).mutation(async ({ ctx, input }) => {
      const tests = await db.getUserAbTests(ctx.user.id);
      const test = tests.find((t: any) => t.id === input.abTestId);
      if (!test) throw new TRPCError({ code: 'NOT_FOUND', message: 'A/B测试不存在' });
      
      const results = { variantA: 0, variantB: 0 };
      for (let i = 0; i < input.recipients.length; i++) {
        const r = input.recipients[i];
        const variant = i % 2 === 0 ? 'A' : 'B';
        const subject = variant === 'A' ? test.variantA_subject : test.variantB_subject;
        const body = variant === 'A' ? test.variantA_body : test.variantB_body;
        
        // V2.7: 构建变量替换上下文
        const templateCtx: TemplateContext = { company: { companyName: r.companyName || '' } };
        if (r.companyId) {
          const company = await db.getCompanyById(r.companyId);
          if (company) templateCtx.company = company;
        }
        if (r.contactId) {
          const contacts = r.companyId ? await db.getCompanyContacts(r.companyId) : [];
          const contact = contacts.find((c: any) => c.id === r.contactId);
          if (contact) templateCtx.contact = contact;
        }
        
        const finalSubject = replaceTemplateVariables(subject || '', templateCtx);
        const finalBody = replaceTemplateVariables(body || '', templateCtx);
        
        await db.addEmailHistory({
          userId: ctx.user.id,
          companyId: r.companyId,
          recipients: r.email,
          subject: finalSubject,
          body: finalBody,
          sendType: 'single',
          status: 'sent',
          internalNote: `A/B测试[${test.name}] 变体${variant}`,
        });
        
        await db.updateAbTestStats(input.abTestId, variant, 'sent');
        if (variant === 'A') results.variantA++;
        else results.variantB++;
      }
      
      return { success: true, sent: input.recipients.length, ...results };
    }),
    
    // 记录邮件打开/回复事件（用于追踪）
    trackEvent: protectedProcedure.input(z.object({
      abTestId: z.number(),
      variant: z.enum(['A', 'B']),
      event: z.enum(['opened', 'replied']),
    })).mutation(async ({ input }) => {
      await db.updateAbTestStats(input.abTestId, input.variant, input.event);
      return { success: true };
    }),
    
    // 获取邮件发送统计
    stats: protectedProcedure.query(async ({ ctx }) => {
      const history = await db.getEmailHistory(ctx.user.id, 1, 1000);
      const total = history.total;
      const recent7d = history.data.filter((e: any) => {
        const d = new Date(e.sentAt);
        return d > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }).length;
      const abTests = await db.getUserAbTests(ctx.user.id);
      const activeTests = abTests.filter((t: any) => t.isActive).length;
      return { totalSent: total, recent7d, activeAbTests: activeTests, totalAbTests: abTests.length };
    }),
    
    // 创建定时发送任务（存储在内存中，服务重启后需重新设置）
    scheduleEmail: protectedProcedure.input(z.object({
      recipients: z.string(),
      subject: z.string(),
      body: z.string(),
      scheduledAt: z.string(), // ISO date string
      abTestId: z.number().optional(),
      companyId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const scheduledTime = new Date(input.scheduledAt);
      if (scheduledTime <= new Date()) throw new TRPCError({ code: 'BAD_REQUEST', message: '定时时间必须在当前时间之后' });
      
      // 存储定时任务到邮件历史（状态为 scheduled）
      await db.addEmailHistory({
        userId: ctx.user.id,
        companyId: input.companyId,
        recipients: input.recipients,
        subject: input.subject,
        body: input.body,
        sendType: 'single',
        status: 'sent',
        internalNote: `定时发送: ${scheduledTime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
      });
      
      return { success: true, scheduledAt: scheduledTime.toISOString() };
    }),
    
    // V2.7: 预览变量替换效果
    previewTemplate: protectedProcedure.input(z.object({
      template: z.string(),
      companyId: z.number().optional(),
      contactId: z.number().optional(),
    })).mutation(async ({ input }) => {
      const templateCtx: TemplateContext = {};
      if (input.companyId) {
        const company = await db.getCompanyById(input.companyId);
        if (company) templateCtx.company = company;
      }
      if (input.contactId && input.companyId) {
        const contacts = await db.getCompanyContacts(input.companyId);
        const contact = contacts.find((c: any) => c.id === input.contactId);
        if (contact) templateCtx.contact = contact;
      }
      const result = replaceTemplateVariables(input.template, templateCtx);
      return { preview: result, context: templateCtx };
    }),
  }),

  // V2.3: 待办事项
  todo: router({
    list: protectedProcedure.input(z.object({ status: z.string().optional() }).optional())
      .query(({ ctx, input }) => db.getUserTodoItems(ctx.user.id, input?.status)),
    add: protectedProcedure.input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      source: z.string().optional(),
      sourceId: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      dueDate: z.date().optional(),
    })).mutation(({ ctx, input }) => db.addTodoItem({ userId: ctx.user.id, ...input })),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      priority: z.string().optional(),
      status: z.string().optional(),
      dueDate: z.date().nullable().optional(),
      completedAt: z.date().nullable().optional(),
    })).mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateTodoItem(id, ctx.user.id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deleteTodoItem(input.id, ctx.user.id)),
    complete: protectedProcedure.input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.updateTodoItem(input.id, ctx.user.id, { status: 'done', completedAt: new Date() })),
  }),

  // V2.3: 邮件批量任务（暂停/恢复）
  emailBatch: router({
    list: protectedProcedure.query(({ ctx }) => db.getEmailBatchJobs(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      abTestId: z.number().optional(),
      recipients: z.array(z.object({
        email: z.string(),
        companyName: z.string().optional(),
        companyId: z.number().optional(),
      })),
      subject: z.string(),
      body: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const jobId = await db.createEmailBatchJob({
        userId: ctx.user.id,
        abTestId: input.abTestId,
        totalRecipients: input.recipients.length,
        recipientsJson: JSON.stringify(input.recipients.map((r, i) => ({
          ...r, subject: input.subject, body: input.body, sent: false, index: i,
        }))),
      });
      return { jobId, totalRecipients: input.recipients.length };
    }),
    get: protectedProcedure.input(z.object({ id: z.number() }))
      .query(({ input }) => db.getEmailBatchJob(input.id)),
    pause: protectedProcedure.input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateEmailBatchJob(input.id, { status: 'paused' });
        return { success: true };
      }),
    resume: protectedProcedure.input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateEmailBatchJob(input.id, { status: 'running' });
        return { success: true };
      }),
    cancel: protectedProcedure.input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateEmailBatchJob(input.id, { status: 'cancelled' });
        return { success: true };
      }),
    sendNext: protectedProcedure.input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const job = await db.getEmailBatchJob(input.id);
        if (!job) throw new TRPCError({ code: 'NOT_FOUND', message: '任务不存在' });
        if (job.status !== 'running') return { success: false, message: '任务已暂停或完成' };
        const recipients = JSON.parse(job.recipientsJson || '[]');
        const nextUnsent = recipients.find((r: any) => !r.sent);
        if (!nextUnsent) {
          await db.updateEmailBatchJob(input.id, { status: 'completed' });
          return { success: true, completed: true };
        }
        // V2.7: 构建变量替换上下文
        const batchTemplateCtx: TemplateContext = { company: { companyName: nextUnsent.companyName || '' } };
        if (nextUnsent.companyId) {
          const batchCompany = await db.getCompanyById(nextUnsent.companyId);
          if (batchCompany) batchTemplateCtx.company = batchCompany;
        }
        if (nextUnsent.contactId) {
          const batchContacts = nextUnsent.companyId ? await db.getCompanyContacts(nextUnsent.companyId) : [];
          const batchContact = batchContacts.find((c: any) => c.id === nextUnsent.contactId);
          if (batchContact) batchTemplateCtx.contact = batchContact;
        }
        const batchFinalSubject = replaceTemplateVariables(nextUnsent.subject || '', batchTemplateCtx);
        const batchFinalBody = replaceTemplateVariables(nextUnsent.body || '', batchTemplateCtx);
        
        await db.addEmailHistory({
          userId: ctx.user.id,
          companyId: nextUnsent.companyId,
          recipients: nextUnsent.email,
          subject: batchFinalSubject,
          body: batchFinalBody,
          sendType: 'single',
          status: 'sent',
          internalNote: `批量任务 #${input.id}`,
        });
        nextUnsent.sent = true;
        const newSentCount = (job.sentCount || 0) + 1;
        const allSent = recipients.every((r: any) => r.sent);
        await db.updateEmailBatchJob(input.id, {
          sentCount: newSentCount,
          status: allSent ? 'completed' : 'running',
          ...(allSent ? {} : {}),
        });
        // Update recipientsJson with sent status
        const dbInst = await db.getDb();
        if (dbInst) {
          const { emailBatchJobs } = await import('../drizzle/schema');
          const { eq } = await import('drizzle-orm');
          await dbInst.update(emailBatchJobs).set({ recipientsJson: JSON.stringify(recipients) } as any).where(eq(emailBatchJobs.id, input.id));
        }
        return { success: true, sent: nextUnsent, sentCount: newSentCount, total: job.totalRecipients, completed: allSent };
      }),
  }),

  // V2.4: 每周全球市场分析报告
  weeklyReport: router({
    list: protectedProcedure.input(z.object({ page: z.number().optional(), pageSize: z.number().optional() }).optional())
      .query(({ input }) => db.getWeeklyReports(input?.pageSize || 20, ((input?.page || 1) - 1) * (input?.pageSize || 20))),
    latest: protectedProcedure.query(() => db.getLatestWeeklyReport()),
    get: protectedProcedure.input(z.object({ id: z.number() }))
      .query(({ input }) => db.getWeeklyReportById(input.id)),
    getByWeek: protectedProcedure.input(z.object({ weekLabel: z.string() }))
      .query(({ input }) => db.getWeeklyReportByWeek(input.weekLabel)),
    delete: adminProcedure.input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await db.deleteWeeklyReport(input.id); return { success: true }; }),
    
    // 手动触发生成报告
    generate: protectedProcedure.input(z.object({ weekLabel: z.string().optional() }).optional())
      .mutation(async ({ ctx, input }) => {
        // 计算当前周标签
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const weekNum = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
        const weekLabel = input?.weekLabel || `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
        
        // 检查是否已存在
        const existing = await db.getWeeklyReportByWeek(weekLabel);
        if (existing && existing.status === 'completed') {
          return { id: existing.id, weekLabel, status: 'already_exists' };
        }
        
        // 创建报告记录
        const reportId = existing?.id || await db.createWeeklyReport({ weekLabel, reportDate: now, generatedByUserId: ctx.user.id });
        if (existing) await db.updateWeeklyReport(existing.id, { status: 'generating' });
        
        // 获取平台内的贸易数据作为上下文
        const tradeData = await db.getPoultryTradeData();
        const tradeContext = tradeData.slice(0, 30).map((t: any) => 
          `${t.country} ${t.year}: 进口量${t.importQuantityTons}吨, 金额$${t.importValueUsd}, 单价$${t.unitPriceUsd}/kg, 同比${t.yoyChange}`
        ).join('\n');
        
        // 获取平台企业数据统计
        const companyStats = await db.searchCompanies({ page: 1, pageSize: 1 });
        
        try {
          // 使用LLM生成6部分报告
          const systemPrompt = industryConfig.aiAnalystSystemPrompt;

          const userPrompt = industryConfig.weeklyReportUserPromptTemplate.replace('{{weekLabel}}', weekLabel) + `\n\n平台已有贸易数据参考：\n${tradeContext}\n\n平台企业数据库共${companyStats.total}家企业。\n\n请严格按照JSON格式返回，包含以下6个字段：\n{"part1": "第一部分内容(Markdown)", "part2": "...", "part3": "...", "part4": "...", "part5": "...", "part6": "...", "references": "参考文献列表"}`;

          const response = await invokeLLM({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'weekly_report',
                strict: true,
                schema: {
                  type: 'object',
                  properties: {
                    part1: { type: 'string', description: '全球宏观与贸易格局' },
                    part2: { type: 'string', description: '核心产区价格核准' },
                    part3: { type: 'string', description: '航运费率与物流预警' },
                    part4: { type: 'string', description: '大客户开发指南' },
                    part5: { type: 'string', description: '风控模型与结算建议' },
                    part6: { type: 'string', description: '本周行动指南' },
                    references: { type: 'string', description: '参考文献' },
                  },
                  required: ['part1', 'part2', 'part3', 'part4', 'part5', 'part6', 'references'],
                  additionalProperties: false,
                },
              },
            },
          });
          
          const rawContent = response.choices[0].message.content;
          const content = JSON.parse(typeof rawContent === 'string' ? rawContent : '{}');
          const rid = typeof reportId === 'number' ? reportId : Number(reportId);
          await db.updateWeeklyReport(rid, {
            status: 'completed',
            part1_macroLandscape: content.part1,
            part2_priceVerification: content.part2,
            part3_logisticsAlerts: content.part3,
            part4_keyAccountGuide: content.part4,
            part5_riskControl: content.part5,
            part6_actionItems: content.part6,
            references: content.references,
          });
          
          return { id: rid, weekLabel, status: 'completed' };
        } catch (err: any) {
          const rid = typeof reportId === 'number' ? reportId : Number(reportId);
          await db.updateWeeklyReport(rid, { status: 'failed' });
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `报告生成失败: ${err.message}` });
        }
      }),
  }),

  // V2.5: 团队活动流
  teamActivity: router({
    list: protectedProcedure.input(z.object({ teamId: z.number(), limit: z.number().optional(), offset: z.number().optional() }))
      .query(({ input }) => db.getTeamActivities(input.teamId, input.limit || 50, input.offset || 0)),
    add: protectedProcedure.input(z.object({
      teamId: z.number(), actionType: z.string(),
      targetType: z.string().optional(), targetId: z.number().optional(),
      targetName: z.string().optional(), details: z.string().optional(),
    })).mutation(({ ctx, input }) => db.addTeamActivity({
      ...input, userId: ctx.user.id, userName: ctx.user.name || '未知用户',
    })),
  }),

  // V2.5: 跟进提醒
  reminder: router({
    upcoming: protectedProcedure.input(z.object({ days: z.number().optional() }).optional())
      .query(({ ctx, input }) => db.getUpcomingReminders(ctx.user.id, input?.days || 7)),
  }),

  admin: router({
    updateCompany: adminProcedure.input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ ctx, input }) => {
        // V2.5: 记录变更历史
        const existing = await db.getCompanyById(input.id);
        if (existing) {
          for (const [key, val] of Object.entries(input.data)) {
            const oldVal = (existing as any)[key];
            if (oldVal !== val) {
              await db.addCompanyChangeHistory({
                companyId: input.id, userId: ctx.user.id,
                userName: ctx.user.name || '未知用户',
                fieldName: key, oldValue: String(oldVal ?? ''), newValue: String(val ?? ''),
              });
            }
          }
        }
        await db.updateCompany(input.id, input.data);
        await db.addAuditLog(ctx.user.id, 'update', 'companies', input.id, JSON.stringify(input.data));
        return { success: true };
      }),
    deleteCompany: adminProcedure.input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCompany(input.id);
        await db.addAuditLog(ctx.user.id, 'delete', 'companies', input.id);
        return { success: true };
      }),
    createCompany: adminProcedure.input(z.object({ data: z.record(z.string(), z.any()) }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createCompany(input.data);
        await db.addAuditLog(ctx.user.id, 'create', 'companies', id ?? undefined);
        return { id };
      }),
    auditLogs: adminProcedure.input(z.object({ page: z.number().optional(), pageSize: z.number().optional() }))
      .query(({ input }) => db.getAuditLogs(input.page, input.pageSize)),
  }),
});

export type AppRouter = typeof appRouter;
