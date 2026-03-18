import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import {
  Globe, ExternalLink, Phone, Mail, User, Plus, Trash2, Linkedin, Star,
  Building2, Calendar, TrendingUp, Shield
} from "lucide-react";

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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">企业信息</TabsTrigger>
            <TabsTrigger value="contacts">
              联系人 {contacts?.length ? "(" + contacts.length + ")" : ""}
            </TabsTrigger>
            <TabsTrigger value="credit">信用评级</TabsTrigger>
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
              <div className="flex justify-end">
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowAddContact(!showAddContact)}>
                  <Plus className="h-3 w-3" />{showAddContact ? "取消" : "添加联系人"}
                </Button>
              </div>
            )}

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
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
