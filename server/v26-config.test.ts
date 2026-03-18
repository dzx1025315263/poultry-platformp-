import { describe, it, expect } from "vitest";
import { industryConfig } from "@shared/industry-config";
import type { IndustryConfig } from "@shared/industry-config/types";

describe("V2.6 - Industry Config System", () => {
  
  describe("Config structure completeness", () => {
    it("should export a valid industryConfig object", () => {
      expect(industryConfig).toBeDefined();
      expect(typeof industryConfig).toBe("object");
    });

    it("should have all required basic info fields", () => {
      expect(industryConfig.platformName).toBeTruthy();
      expect(industryConfig.platformShortName).toBeTruthy();
      expect(industryConfig.industryKey).toBeTruthy();
      expect(industryConfig.industryLabel).toBeTruthy();
      expect(industryConfig.productLabel).toBeTruthy();
      expect(industryConfig.productLabelEn).toBeTruthy();
      expect(industryConfig.industryName).toBeTruthy();
    });

    it("should have valid role tags arrays", () => {
      expect(Array.isArray(industryConfig.roleTags)).toBe(true);
      expect(industryConfig.roleTags.length).toBeGreaterThan(0);
      expect(Array.isArray(industryConfig.exportRoleTags)).toBe(true);
      expect(industryConfig.exportRoleTags.length).toBeGreaterThan(0);
    });

    it("should have valid trade data fields", () => {
      expect(industryConfig.hsCode).toBeTruthy();
      expect(industryConfig.hsCodeDesc).toBeTruthy();
      expect(industryConfig.tradePageTitle).toBeTruthy();
      expect(industryConfig.tradePageSubtitle).toBeTruthy();
      expect(industryConfig.topImportersLabel).toBeTruthy();
      expect(industryConfig.tradeDataSource).toBeTruthy();
    });

    it("should have valid region insights", () => {
      expect(Array.isArray(industryConfig.regionInsights)).toBe(true);
      expect(industryConfig.regionInsights.length).toBeGreaterThan(0);
      industryConfig.regionInsights.forEach((region) => {
        expect(region.region).toBeTruthy();
        expect(region.icon).toBeTruthy();
        expect(region.color).toBeTruthy();
        expect(Array.isArray(region.items)).toBe(true);
        region.items.forEach((item) => {
          expect(["warning", "opportunity", "trend"]).toContain(item.type);
          expect(item.title).toBeTruthy();
          expect(item.desc).toBeTruthy();
        });
      });
    });

    it("should have valid AI prompts", () => {
      expect(industryConfig.aiMatchExpertPrompt).toBeTruthy();
      expect(industryConfig.aiMatchExpertPrompt.length).toBeGreaterThan(20);
      expect(industryConfig.aiAnalystSystemPrompt).toBeTruthy();
      expect(industryConfig.aiAnalystSystemPrompt.length).toBeGreaterThan(50);
    });

    it("should have valid weekly report fields", () => {
      expect(industryConfig.weeklyReportTitle).toBeTruthy();
      expect(industryConfig.weeklyReportTitleEn).toBeTruthy();
      expect(industryConfig.weeklyReportUserPromptTemplate).toContain("{{weekLabel}}");
      expect(industryConfig.weeklyReportLoadingText).toBeTruthy();
    });

    it("should have valid feishu notification fields", () => {
      expect(industryConfig.feishuBotName).toBeTruthy();
      expect(industryConfig.feishuGroupName).toBeTruthy();
      expect(industryConfig.feishuSignature).toBeTruthy();
    });

    it("should have valid home page fields", () => {
      expect(industryConfig.homeSubtitle).toBeTruthy();
      expect(industryConfig.homeTotalDesc).toBeTruthy();
      expect(industryConfig.homeChinaPurchaseDesc).toBeTruthy();
    });

    it("should have valid report and login page fields", () => {
      expect(industryConfig.reportPageSubtitle).toBeTruthy();
      expect(industryConfig.loginTitle).toBeTruthy();
      expect(industryConfig.loginDesc).toBeTruthy();
    });
  });

  describe("Poultry config specifics", () => {
    it("should be configured for poultry industry by default", () => {
      expect(industryConfig.industryKey).toBe("poultry");
      expect(industryConfig.hsCode).toBe("0207");
    });

    it("should have poultry-specific role tags", () => {
      expect(industryConfig.roleTags).toContain("全产业链巨头");
      expect(industryConfig.roleTags).toContain("进口商/贸易商");
    });

    it("should have at least 4 region insights", () => {
      expect(industryConfig.regionInsights.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Config type safety", () => {
    it("should satisfy IndustryConfig interface", () => {
      // This test verifies the config object has the correct shape
      const config: IndustryConfig = industryConfig;
      expect(config).toBeDefined();
    });

    it("should not contain undefined values for required fields", () => {
      const requiredStringFields: (keyof IndustryConfig)[] = [
        'platformName', 'platformShortName', 'industryKey', 'industryLabel',
        'productLabel', 'productLabelEn', 'industryName', 'hsCode', 'hsCodeDesc',
        'tradePageTitle', 'tradePageSubtitle', 'topImportersLabel', 'tradeDataSource',
        'aiMatchExpertPrompt', 'aiAnalystSystemPrompt', 'weeklyReportTitle',
        'weeklyReportTitleEn', 'weeklyReportUserPromptTemplate', 'weeklyReportLoadingText',
        'feishuBotName', 'feishuGroupName', 'feishuSignature',
        'homeSubtitle', 'homeTotalDesc', 'homeChinaPurchaseDesc',
        'reportPageSubtitle', 'loginTitle', 'loginDesc'
      ];
      requiredStringFields.forEach((field) => {
        expect(industryConfig[field], `Field ${field} should not be undefined`).toBeDefined();
        expect(typeof industryConfig[field], `Field ${field} should be a string`).toBe("string");
      });
    });
  });
});
