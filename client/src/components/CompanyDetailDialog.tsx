import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useState, useRef } from "react";
import {
  Globe, ExternalLink, Phone, Mail, User, Plus, Trash2, Linkedin, Star,
  Building2, Calendar, TrendingUp, Shield, Upload, Send, FileSpreadsheet,
  Users, History
} from "lucide-react";
import TemplateVariableInsert from "@/components/TemplateVariableInsert";
import type { TemplateContext } from "@shared/emailTemplateVars";

interface CompanyDetailDialogProps {
  company: any;
  open: boolean;
  onClose: () => void;
}

export default function CompanyDetailDialog({ company, open, onClose }: CompanyDetailDialogProps) {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("info");
  const [newContact, setNewContact] = useState({ name: "", title: "", email: "", phone: "", linkedin: "" });
  const [showAddContact, setShowAddContact] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk email state
  const [showBulkEmail, setShowBulkEmail] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const { data: contacts, refetch: refetchContacts } = trpc.contact.list.useQuery(
    { companyId: company?.id },
    { enabled: !!company?.id && open }
  );
  const { data: credit } = trpc.credit.get.useQuery(
    { companyId: company?.id },
    { enabled: !!company?.id && open }
  );

  const addContactMutation = trpc.contact.add.useMutation({
    onSuccess: () => {
      refetchContacts();
      setNewContact({ name: "", title: "", email: "", phone: "", linkedin: "" });
      setShowAddContact(false);
      toast.success("联系人已添加");
    },
  });
  const deleteContactMutation = trpc.contact.delete.useMutation({
    onSuccess: () => { refetchContacts(); toast.success("联系人已删除"); },
  });
  const bulkImportMutation = trpc.contact.bulkImport.useMutation({
    onSuccess: (data) => {
      refetchContacts();
      setBulkCsvText("");
      setShowBulkImport(false);
      toast.success(`成功导入 ${data.imported} 个联系人`);
    },
    onError: (err) => toast.error("导入失败: " + err.message),
  });
  const bulkEmailMutation = trpc.contact.bulkEmail.useMutation({
    onSuccess: (data) => {
      setShowBulkEmail(false);
      setSelectedContactIds([]);
      setEmailSubject("");
      setEmailBody("");
      toast.success(`已发送邮件给 ${data.sent} 个联系人`);
    },
    onError: (err) => toast.error("发送失败: " + err.message),
  });

  if (!company) return null;

  const getCreditColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    if (score >= 40) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  const getCreditLabel = (score: number) => {
    if (score >= 80) return "优秀";
    if (score >= 60) return "良好";
    if (score >= 40) return "一般";
    return "较低";
  };

  const parseCsvContacts = (text: string) => {
    const lines = text.trim().split("\n").filter(l => l.trim());
    if (lines.length === 0) return [];
    // Try to detect header
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes("name") || firstLine.includes("姓名") || firstLine.includes("email");
    const dataLines = hasHeader ? lines.slice(1) : lines;
    return dataLines.map(line => {
      const parts = line.split(/[,\t]/).map(s => s.trim().replace(/^["']|["']$/g, ""));
      return {
        name: parts[0] || "",
        title: parts[1] || "",
        email: parts[2] || "",
        phone: parts[3] || "",
        linkedin: parts[4] || "",
      };
    }).filter(c => c.name);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setBulkCsvText(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleBulkImport = () => {
    const parsed = parseCsvContacts(bulkCsvText);
    if (parsed.length === 0) {
      toast.error("未解析到有效联系人数据");
      return;
    }
    bulkImportMutation.mutate({ companyId: company.id, contacts: parsed });
  };

  const toggleContactSelection = (id: number) => {
    setSelectedContactIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllContacts = () => {
    if (!contacts) return;
    const emailContacts = contacts.filter((c: any) => c.email);
    if (selectedContactIds.length === emailContacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(emailContacts.map((c: any) => c.id));
    }
  };

  const handleBulkEmail = () => {
    if (selectedContactIds.length === 0) { toast.error("请选择至少一个联系人"); return; }
    if (!emailSubject.trim()) { toast.error("请输入邮件主题"); return; }
    if (!emailBody.trim()) { toast.error("请输入邮件正文"); return; }
    bulkEmailMutation.mutate({
      companyId: company.id,
      contactIds: selectedContactIds,
      subject: emailSubject,
      body: emailBody,
    });
  };

  const emailContactsCount = contacts?.filter((c: any) => c.email).length || 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {company.companyName}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info">企业信息</TabsTrigger>
            <TabsTrigger value="contacts">
              联系人 {contacts?.length ? "(" + contacts.length + ")" : ""}
            </TabsTrigger>
            <TabsTrigger value="credit">信用评级</TabsTrigger>
            <TabsTrigger value="similar">相似企业</TabsTrigger>
            <TabsTrigger value="history">变更历史</TabsTrigger>
          </TabsList>

          {/* Company Info Tab */}
          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">国家/地区</p>
                <p className="text-sm font-medium flex items-center gap-1"><Globe className="h-3 w-3" />{company.country}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">大洲</p>
                <p className="text-sm font-medium">{company.continent}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">核心角色</p>
                <Badge variant="secondary">{company.coreRole || "未分类"}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">是否在中国采购</p>
                <Badge variant={company.hasPurchasedFromChina === "是" ? "default" : "outline"}>
                  {company.hasPurchasedFromChina || "未知"}
                </Badge>
              </div>
            </div>
            {company.companyProfile && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">公司简介</p>
                <p className="text-sm">{company.companyProfile}</p>
              </div>
            )}
            {company.mainProducts && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">主营产品</p>
                <p className="text-sm">{company.mainProducts}</p>
              </div>
            )}
            {company.purchasePreference && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">采购倾向</p>
                <p className="text-sm">{company.purchasePreference}</p>
              </div>
            )}
            {company.contactInfo && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">联系方式</p>
                <p className="text-sm flex items-center gap-1"><Phone className="h-3 w-3" />{company.contactInfo}</p>
              </div>
            )}
            {company.websiteSocial && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">网站/社媒</p>
                <a href={company.websiteSocial.startsWith("http") ? company.websiteSocial : "https://" + company.websiteSocial}
                  target="_blank" rel="noopener noreferrer"
                  className="text-sm text-primary flex items-center gap-1 hover:underline">
                  <ExternalLink className="h-3 w-3" />{company.websiteSocial}
                </a>
              </div>
            )}
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-4">
            {isAuthenticated && (
              <div className="flex flex-wrap gap-2 justify-end">
                <Button size="sm" variant="outline" className="gap-1" onClick={() => { setShowBulkEmail(!showBulkEmail); setShowAddContact(false); setShowBulkImport(false); }}>
                  <Send className="h-3 w-3" />{showBulkEmail ? "取消" : "批量发邮件"}
                  {emailContactsCount > 0 && !showBulkEmail && (
                    <Badge variant="secondary" className="ml-1 text-[10px] h-4">{emailContactsCount}</Badge>
                  )}
                </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => { setShowBulkImport(!showBulkImport); setShowAddContact(false); setShowBulkEmail(false); }}>
                  <Upload className="h-3 w-3" />{showBulkImport ? "取消" : "批量导入"}
                </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => { setShowAddContact(!showAddContact); setShowBulkImport(false); setShowBulkEmail(false); }}>
                  <Plus className="h-3 w-3" />{showAddContact ? "取消" : "添加"}
                </Button>
              </div>
            )}

            {/* Bulk Email Panel */}
            {showBulkEmail && (
              <Card className="border-blue-200 bg-blue-50/30">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Send className="h-4 w-4 text-blue-600" />
                      批量发送邮件
                    </p>
                    {contacts && contacts.length > 0 && (
                      <Button size="sm" variant="ghost" className="text-xs h-6" onClick={selectAllContacts}>
                        {selectedContactIds.length === emailContactsCount ? "取消全选" : "全选有邮箱的联系人"}
                      </Button>
                    )}
                  </div>

                  {/* Contact selection */}
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {contacts?.map((contact: any) => (
                      <label key={contact.id} className={`flex items-center gap-2 p-1.5 rounded text-sm ${!contact.email ? 'opacity-40' : 'hover:bg-blue-100/50 cursor-pointer'}`}>
                        <Checkbox
                          checked={selectedContactIds.includes(contact.id)}
                          onCheckedChange={() => toggleContactSelection(contact.id)}
                          disabled={!contact.email}
                        />
                        <span className="font-medium">{contact.name}</span>
                        {contact.title && <span className="text-xs text-muted-foreground">({contact.title})</span>}
                        {contact.email ? (
                          <span className="text-xs text-muted-foreground ml-auto">{contact.email}</span>
                        ) : (
                          <span className="text-xs text-red-400 ml-auto">无邮箱</span>
                        )}
                      </label>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">邮件主题 *</Label>
                        <TemplateVariableInsert
                          value={emailSubject}
                          onInsert={setEmailSubject}
                          showPreview={false}
                          previewContext={{ company: company, contact: contacts?.find((c: any) => selectedContactIds.includes(c.id)) } as TemplateContext}
                        />
                      </div>
                      <Input placeholder="输入邮件主题，可使用 {{公司名}} {{联系人}} 等变量" value={emailSubject}
                        onChange={e => setEmailSubject(e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">邮件正文 *</Label>
                        <TemplateVariableInsert
                          value={emailBody}
                          onInsert={setEmailBody}
                          previewContext={{ company: company, contact: contacts?.find((c: any) => selectedContactIds.includes(c.id)) } as TemplateContext}
                        />
                      </div>
                      <Textarea placeholder="输入邮件正文内容...可使用 {{公司名}} {{联系人}} {{国家}} 等变量" value={emailBody}
                        onChange={e => setEmailBody(e.target.value)} className="text-sm min-h-[80px]" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      已选择 {selectedContactIds.length} 个联系人
                    </span>
                    <Button size="sm" disabled={selectedContactIds.length === 0 || !emailSubject || !emailBody || bulkEmailMutation.isPending}
                      onClick={handleBulkEmail}>
                      {bulkEmailMutation.isPending ? "发送中..." : `发送给 ${selectedContactIds.length} 人`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bulk Import Panel */}
            {showBulkImport && (
              <Card className="border-green-200 bg-green-50/30">
                <CardContent className="pt-4 space-y-3">
                  <p className="text-sm font-medium flex items-center gap-1">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    批量导入联系人
                  </p>
                  <p className="text-xs text-muted-foreground">
                    支持 CSV/TSV 格式，每行一个联系人。列顺序：姓名, 职位, 邮箱, 电话, LinkedIn
                  </p>
                  <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} accept=".csv,.tsv,.txt" className="hidden" onChange={handleFileUpload} />
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-3 w-3" />选择文件
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs"
                      onClick={() => setBulkCsvText("姓名,职位,邮箱,电话,LinkedIn\nJohn Smith,采购经理,john@example.com,+1-555-0100,https://linkedin.com/in/john")}>
                      填入示例
                    </Button>
                  </div>
                  <Textarea
                    placeholder={"姓名,职位,邮箱,电话,LinkedIn\nJohn Smith,采购经理,john@example.com,+1-555-0100,"}
                    value={bulkCsvText}
                    onChange={e => setBulkCsvText(e.target.value)}
                    className="text-xs font-mono min-h-[80px]"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      解析到 {parseCsvContacts(bulkCsvText).length} 个联系人
                    </span>
                    <Button size="sm" disabled={parseCsvContacts(bulkCsvText).length === 0 || bulkImportMutation.isPending}
                      onClick={handleBulkImport}>
                      {bulkImportMutation.isPending ? "导入中..." : `导入 ${parseCsvContacts(bulkCsvText).length} 个联系人`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add Single Contact */}
            {showAddContact && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">姓名 *</Label>
                      <Input placeholder="联系人姓名" value={newContact.name}
                        onChange={e => setNewContact({ ...newContact, name: e.target.value })} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">职位</Label>
                      <Input placeholder="如：采购经理" value={newContact.title}
                        onChange={e => setNewContact({ ...newContact, title: e.target.value })} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">邮箱</Label>
                      <Input placeholder="email@example.com" value={newContact.email}
                        onChange={e => setNewContact({ ...newContact, email: e.target.value })} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">电话</Label>
                      <Input placeholder="+86 xxx" value={newContact.phone}
                        onChange={e => setNewContact({ ...newContact, phone: e.target.value })} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs">LinkedIn</Label>
                      <Input placeholder="LinkedIn个人主页URL" value={newContact.linkedin}
                        onChange={e => setNewContact({ ...newContact, linkedin: e.target.value })} className="h-8 text-sm" />
                    </div>
                  </div>
                  <Button size="sm" disabled={!newContact.name || addContactMutation.isPending}
                    onClick={() => addContactMutation.mutate({ companyId: company.id, ...newContact })}>
                    {addContactMutation.isPending ? "添加中..." : "确认添加"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {!contacts?.length ? (
              <div className="text-center py-8">
                <User className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">暂无联系人信息</p>
                <p className="text-xs text-muted-foreground">添加关键决策人信息，提升沟通效率</p>
              </div>
            ) : (
              <div className="space-y-2">
                {contacts.map((contact: any) => (
                  <Card key={contact.id}>
                    <CardContent className="py-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{contact.name}</p>
                            {contact.isPrimary && <Badge variant="default" className="text-[10px] h-4">主要</Badge>}
                            {contact.title && <Badge variant="outline" className="text-[10px] h-4">{contact.title}</Badge>}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            {contact.email && (
                              <a href={"mailto:" + contact.email} className="flex items-center gap-1 hover:text-primary">
                                <Mail className="h-3 w-3" />{contact.email}
                              </a>
                            )}
                            {contact.phone && (
                              <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{contact.phone}</span>
                            )}
                            {contact.linkedin && (
                              <a href={contact.linkedin} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-primary">
                                <Linkedin className="h-3 w-3" />LinkedIn
                              </a>
                            )}
                          </div>
                        </div>
                        {isAuthenticated && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                            onClick={() => deleteContactMutation.mutate({ id: contact.id })}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Credit Rating Tab */}
          <TabsContent value="credit" className="space-y-4">
            {credit ? (
              <>
                <div className="flex items-center justify-center py-4">
                  <div className={"flex flex-col items-center gap-2 p-6 rounded-full " + getCreditColor(credit.creditScore || 0)}>
                    <Star className="h-8 w-8" />
                    <span className="text-3xl font-bold">{credit.creditScore || 0}</span>
                    <span className="text-sm font-medium">{getCreditLabel(credit.creditScore || 0)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {credit.registeredCapital && (
                    <Card>
                      <CardContent className="py-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" />注册资本</p>
                        <p className="font-medium text-sm mt-1">{credit.registeredCapital}</p>
                      </CardContent>
                    </Card>
                  )}
                  {credit.foundedYear && (
                    <Card>
                      <CardContent className="py-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />成立年份</p>
                        <p className="font-medium text-sm mt-1">{credit.foundedYear}年（{new Date().getFullYear() - credit.foundedYear}年历史）</p>
                      </CardContent>
                    </Card>
                  )}
                  {credit.importFrequency && (
                    <Card>
                      <CardContent className="py-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" />进口频次</p>
                        <p className="font-medium text-sm mt-1">{credit.importFrequency}</p>
                      </CardContent>
                    </Card>
                  )}
                  {credit.cooperationHistory && (
                    <Card>
                      <CardContent className="py-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" />合作历史</p>
                        <p className="font-medium text-sm mt-1">{credit.cooperationHistory}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Star className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">暂无信用评级数据</p>
                <p className="text-xs text-muted-foreground">管理员可在后台为企业添加信用评级</p>
              </div>
            )}
          </TabsContent>
          {/* Similar Companies Tab */}
          <TabsContent value="similar">
            <SimilarCompaniesTab companyId={company?.id} />
          </TabsContent>

          {/* Change History Tab */}
          <TabsContent value="history">
            <ChangeHistoryTab companyId={company?.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function SimilarCompaniesTab({ companyId }: { companyId: number }) {
  const { data: similar, isLoading } = trpc.company.similar.useQuery(
    { companyId, limit: 8 },
    { enabled: !!companyId }
  );

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">同国家/同角色的相似企业</span>
      </div>
      {similar && similar.length > 0 ? (
        <div className="grid grid-cols-1 gap-2">
          {similar.map((c: any) => (
            <Card key={c.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{c.companyName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{c.country}</Badge>
                      {c.coreRole && <Badge variant="secondary" className="text-xs">{c.coreRole}</Badge>}
                    </div>
                  </div>
                  {c.website && (
                    <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </a>
                  )}
                </div>
                {c.mainProducts && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{c.mainProducts}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">暂未找到相似企业</p>
        </div>
      )}
    </div>
  );
}

function ChangeHistoryTab({ companyId }: { companyId: number }) {
  const { data: history, isLoading } = trpc.company.changeHistory.useQuery(
    { companyId, limit: 30 },
    { enabled: !!companyId }
  );

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  const FIELD_LABELS: Record<string, string> = {
    companyName: '企业名称', country: '国家', continent: '大洲',
    website: '网址', coreRole: '核心角色', mainProducts: '主营产品',
    hasPurchasedFromChina: '中国采购', contactInfo: '联系方式',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <History className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">企业数据修改记录</span>
      </div>
      {history && history.length > 0 ? (
        <div className="space-y-2">
          {history.map((h: any) => (
            <div key={h.id} className="border rounded-lg p-3 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{FIELD_LABELS[h.fieldName] || h.fieldName}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(h.createdAt).toLocaleString('zh-CN')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-red-500 line-through">{h.oldValue || '空'}</span>
                <span>→</span>
                <span className="text-green-600">{h.newValue || '空'}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">操作人：{h.userName}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <History className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">暂无变更记录</p>
        </div>
      )}
    </div>
  );
}
