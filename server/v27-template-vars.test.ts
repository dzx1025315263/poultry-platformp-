import { describe, it, expect } from "vitest";
import {
  EMAIL_TEMPLATE_VARIABLES,
  replaceTemplateVariables,
  detectUsedVariables,
  getMissingVariables,
  getSampleContext,
  getVariablesByGroup,
  type TemplateContext,
  type TemplateVariable,
} from "@shared/emailTemplateVars";

describe("V2.7 - Email Template Variable Replacement", () => {

  describe("Variable definitions", () => {
    it("should define at least 10 template variables", () => {
      expect(EMAIL_TEMPLATE_VARIABLES.length).toBeGreaterThanOrEqual(10);
    });

    it("should have unique keys for all variables", () => {
      const keys = EMAIL_TEMPLATE_VARIABLES.map((v) => v.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it("should have unique placeholders for all variables", () => {
      const placeholders = EMAIL_TEMPLATE_VARIABLES.map((v) => v.placeholder);
      expect(new Set(placeholders).size).toBe(placeholders.length);
    });

    it("should have all required fields for each variable", () => {
      for (const v of EMAIL_TEMPLATE_VARIABLES) {
        expect(v.key).toBeTruthy();
        expect(v.label).toBeTruthy();
        expect(v.placeholder).toBeTruthy();
        expect(v.description).toBeTruthy();
        expect(["company", "contact"]).toContain(v.source);
        expect(v.fieldName).toBeTruthy();
        expect(["company", "contact"]).toContain(v.group);
      }
    });

    it("should use double curly brace format for placeholders", () => {
      for (const v of EMAIL_TEMPLATE_VARIABLES) {
        expect(v.placeholder).toMatch(/^\{\{.+\}\}$/);
      }
    });

    it("should include company_name variable", () => {
      const companyName = EMAIL_TEMPLATE_VARIABLES.find((v) => v.key === "company_name");
      expect(companyName).toBeDefined();
      expect(companyName!.placeholder).toBe("{{公司名}}");
      expect(companyName!.source).toBe("company");
      expect(companyName!.fieldName).toBe("companyName");
    });

    it("should include contact_name variable", () => {
      const contactName = EMAIL_TEMPLATE_VARIABLES.find((v) => v.key === "contact_name");
      expect(contactName).toBeDefined();
      expect(contactName!.placeholder).toBe("{{联系人}}");
      expect(contactName!.source).toBe("contact");
      expect(contactName!.fieldName).toBe("name");
    });

    it("should include country variable", () => {
      const country = EMAIL_TEMPLATE_VARIABLES.find((v) => v.key === "country");
      expect(country).toBeDefined();
      expect(country!.placeholder).toBe("{{国家}}");
    });

    it("should include linkedin variable", () => {
      const linkedin = EMAIL_TEMPLATE_VARIABLES.find((v) => v.key === "linkedin");
      expect(linkedin).toBeDefined();
      expect(linkedin!.placeholder).toBe("{{LinkedIn}}");
    });
  });

  describe("replaceTemplateVariables", () => {
    const fullContext: TemplateContext = {
      company: {
        companyName: "ABC Foods",
        country: "Saudi Arabia",
        continent: "中东",
        coreRole: "进口商",
        mainProducts: "Frozen Chicken",
        websiteSocial: "www.abcfoods.com",
      },
      contact: {
        name: "Ahmed",
        title: "Manager",
        email: "ahmed@abc.com",
        phone: "+966-123",
        linkedin: "https://linkedin.com/in/ahmed",
      },
    };

    it("should replace company name variable", () => {
      const result = replaceTemplateVariables("Hello {{公司名}}", fullContext);
      expect(result).toBe("Hello ABC Foods");
    });

    it("should replace contact name variable", () => {
      const result = replaceTemplateVariables("Dear {{联系人}}", fullContext);
      expect(result).toBe("Dear Ahmed");
    });

    it("should replace country variable", () => {
      const result = replaceTemplateVariables("Located in {{国家}}", fullContext);
      expect(result).toBe("Located in Saudi Arabia");
    });

    it("should replace multiple variables in one template", () => {
      const template = "Dear {{联系人}}, We noticed {{公司名}} in {{国家}} is a leading {{核心角色}}.";
      const result = replaceTemplateVariables(template, fullContext);
      expect(result).toBe("Dear Ahmed, We noticed ABC Foods in Saudi Arabia is a leading 进口商.");
    });

    it("should replace same variable used multiple times", () => {
      const template = "{{公司名}} is great. We love {{公司名}}.";
      const result = replaceTemplateVariables(template, fullContext);
      expect(result).toBe("ABC Foods is great. We love ABC Foods.");
    });

    it("should replace all supported variables", () => {
      const template = "{{公司名}} {{国家}} {{大洲}} {{核心角色}} {{主营产品}} {{网站}} {{联系人}} {{职位}} {{邮箱}} {{电话}} {{LinkedIn}}";
      const result = replaceTemplateVariables(template, fullContext);
      expect(result).toBe("ABC Foods Saudi Arabia 中东 进口商 Frozen Chicken www.abcfoods.com Ahmed Manager ahmed@abc.com +966-123 https://linkedin.com/in/ahmed");
    });

    it("should use empty string fallback for missing values", () => {
      const result = replaceTemplateVariables("Hello {{联系人}}", { company: { companyName: "Test" } });
      expect(result).toBe("Hello ");
    });

    it("should use custom fallback for missing values", () => {
      const result = replaceTemplateVariables("Hello {{联系人}}", { company: { companyName: "Test" } }, "[未知]");
      expect(result).toBe("Hello [未知]");
    });

    it("should handle empty template", () => {
      const result = replaceTemplateVariables("", fullContext);
      expect(result).toBe("");
    });

    it("should handle template with no variables", () => {
      const result = replaceTemplateVariables("Hello World", fullContext);
      expect(result).toBe("Hello World");
    });

    it("should handle null/undefined context gracefully", () => {
      const result = replaceTemplateVariables("Hello {{公司名}}", {});
      expect(result).toBe("Hello ");
    });

    it("should handle empty context objects", () => {
      const result = replaceTemplateVariables("{{公司名}} {{联系人}}", { company: {}, contact: {} });
      expect(result).toBe(" ");
    });

    it("should not replace non-variable curly braces", () => {
      const result = replaceTemplateVariables("Hello {world} {{unknown}}", fullContext);
      expect(result).toBe("Hello {world} {{unknown}}");
    });

    it("should handle null field values", () => {
      const ctx: TemplateContext = {
        company: { companyName: null, country: "USA" },
      };
      const result = replaceTemplateVariables("{{公司名}} in {{国家}}", ctx);
      expect(result).toBe(" in USA");
    });
  });

  describe("detectUsedVariables", () => {
    it("should detect single variable", () => {
      const vars = detectUsedVariables("Hello {{公司名}}");
      expect(vars.length).toBe(1);
      expect(vars[0].key).toBe("company_name");
    });

    it("should detect multiple variables", () => {
      const vars = detectUsedVariables("Dear {{联系人}}, {{公司名}} in {{国家}}");
      expect(vars.length).toBe(3);
      const keys = vars.map((v) => v.key);
      expect(keys).toContain("company_name");
      expect(keys).toContain("contact_name");
      expect(keys).toContain("country");
    });

    it("should return empty array for no variables", () => {
      const vars = detectUsedVariables("Hello World");
      expect(vars.length).toBe(0);
    });

    it("should return empty array for empty string", () => {
      const vars = detectUsedVariables("");
      expect(vars.length).toBe(0);
    });

    it("should not detect non-variable patterns", () => {
      const vars = detectUsedVariables("Hello {{unknown_var}}");
      expect(vars.length).toBe(0);
    });
  });

  describe("getMissingVariables", () => {
    it("should return missing variables when context is empty", () => {
      const missing = getMissingVariables("{{公司名}} {{联系人}}", {});
      expect(missing.length).toBe(2);
    });

    it("should return empty when all variables have data", () => {
      const ctx: TemplateContext = {
        company: { companyName: "Test" },
        contact: { name: "John" },
      };
      const missing = getMissingVariables("{{公司名}} {{联系人}}", ctx);
      expect(missing.length).toBe(0);
    });

    it("should return partially missing variables", () => {
      const ctx: TemplateContext = {
        company: { companyName: "Test" },
      };
      const missing = getMissingVariables("{{公司名}} {{联系人}}", ctx);
      expect(missing.length).toBe(1);
      expect(missing[0].key).toBe("contact_name");
    });

    it("should treat empty string as missing", () => {
      const ctx: TemplateContext = {
        company: { companyName: "" },
      };
      const missing = getMissingVariables("{{公司名}}", ctx);
      expect(missing.length).toBe(1);
    });
  });

  describe("getSampleContext", () => {
    it("should return a valid sample context", () => {
      const sample = getSampleContext();
      expect(sample.company).toBeDefined();
      expect(sample.contact).toBeDefined();
    });

    it("should have all company fields populated", () => {
      const sample = getSampleContext();
      expect(sample.company!.companyName).toBeTruthy();
      expect(sample.company!.country).toBeTruthy();
      expect(sample.company!.continent).toBeTruthy();
      expect(sample.company!.coreRole).toBeTruthy();
    });

    it("should have all contact fields populated", () => {
      const sample = getSampleContext();
      expect(sample.contact!.name).toBeTruthy();
      expect(sample.contact!.title).toBeTruthy();
      expect(sample.contact!.email).toBeTruthy();
    });

    it("should produce fully replaced template with sample data", () => {
      const sample = getSampleContext();
      const template = "Dear {{联系人}}, We are contacting {{公司名}} in {{国家}}.";
      const result = replaceTemplateVariables(template, sample);
      expect(result).not.toContain("{{");
      expect(result).not.toContain("}}");
    });
  });

  describe("getVariablesByGroup", () => {
    it("should return two groups", () => {
      const groups = getVariablesByGroup();
      expect(groups.length).toBe(2);
    });

    it("should have company and contact groups", () => {
      const groups = getVariablesByGroup();
      const groupNames = groups.map((g) => g.group);
      expect(groupNames).toContain("company");
      expect(groupNames).toContain("contact");
    });

    it("should have non-empty variables in each group", () => {
      const groups = getVariablesByGroup();
      for (const group of groups) {
        expect(group.variables.length).toBeGreaterThan(0);
        expect(group.label).toBeTruthy();
      }
    });

    it("should include all variables across groups", () => {
      const groups = getVariablesByGroup();
      const totalVars = groups.reduce((sum, g) => sum + g.variables.length, 0);
      expect(totalVars).toBe(EMAIL_TEMPLATE_VARIABLES.length);
    });
  });
});
