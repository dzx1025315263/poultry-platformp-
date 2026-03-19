import { getLoginUrl } from "@/const";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { Globe, BarChart3, Users, Mail, Shield, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663444005248/ftiSfbsLTQqvqGTMZUS5kG/ugg-logo-j85PWW7vM5ztUxW6n5QrfN.png";

const SHOWCASE_IMAGES = [
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663444005248/ftiSfbsLTQqvqGTMZUS5kG/login-hero-dashboard-QJxsckQvHArveGerh5KXBr.webp",
    title: "全球数据分析仪表盘",
    desc: "实时追踪全球禽肉贸易数据与市场动态",
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663444005248/ftiSfbsLTQqvqGTMZUS5kG/login-hero-globe-idWVDfNfDjt5DqknZzgoag.webp",
    title: "全球贸易网络",
    desc: "覆盖七大洲 104 个国家的禽业企业数据",
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663444005248/ftiSfbsLTQqvqGTMZUS5kG/login-hero-crm-3NFRaYwF4SNynwht5efqzZ.webp",
    title: "智能客户管理系统",
    desc: "从线索到成交的全生命周期客户管理",
  },
];

const FEATURES = [
  { icon: Globe, title: "全球企业库", desc: "2,300+ 家禽业企业" },
  { icon: BarChart3, title: "贸易数据", desc: "UN Comtrade 实时数据" },
  { icon: Users, title: "联系人管理", desc: "企业联系人与信用评级" },
  { icon: Mail, title: "智能询盘", desc: "A/B 测试与邮件自动化" },
  { icon: TrendingUp, title: "市场洞察", desc: "AI 驱动的行业分析" },
  { icon: Shield, title: "数据安全", desc: "团队权限与审计日志" },
];

export default function LoginPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SHOWCASE_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => setCurrentSlide(index);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + SHOWCASE_IMAGES.length) % SHOWCASE_IMAGES.length);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % SHOWCASE_IMAGES.length);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">
      {/* Top Navigation Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="UGG Logo" className="h-10 w-auto" />
          <div className="hidden sm:block">
            <div className="text-sm font-semibold text-white/90 leading-tight">Universal Gourmand Group</div>
            <div className="text-xs text-white/40">全球禽业数据协作平台</div>
          </div>
        </div>
        <Button
          onClick={() => { window.location.href = getLoginUrl(); }}
          size="sm"
          className="bg-[#c8a45c] hover:bg-[#b8944c] text-[#0a0f1e] font-semibold px-6 shadow-lg shadow-[#c8a45c]/20"
        >
          飞书登录
        </Button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Left: Brand & Login */}
          <div className="lg:w-[45%] flex flex-col justify-center px-8 lg:px-16 py-12 lg:py-0">
            <div className="max-w-lg mx-auto lg:mx-0 w-full">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#c8a45c]/10 border border-[#c8a45c]/20 text-[#c8a45c] text-xs font-medium mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c8a45c] animate-pulse" />
                  数据实时更新中
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4 leading-tight">
                  全球禽业数据
                  <br />
                  <span className="text-[#c8a45c]">协作平台</span>
                </h1>
                <p className="text-white/50 text-base leading-relaxed">
                  Universal Gourmand Group 旗下专业禽肉外贸数据平台，
                  为您提供全球 2,300+ 家禽业企业数据、贸易分析、智能获客与客户管理一站式解决方案。
                </p>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {FEATURES.map((f) => (
                  <div
                    key={f.title}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-[#1e3a5f]/60 text-[#6ba3e8] shrink-0">
                      <f.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white/80">{f.title}</div>
                      <div className="text-xs text-white/35 mt-0.5">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Login CTA */}
              <div className="space-y-3">
                <Button
                  onClick={() => { window.location.href = getLoginUrl(); }}
                  size="lg"
                  className="w-full bg-gradient-to-r from-[#c8a45c] to-[#d4b06a] hover:from-[#b8944c] hover:to-[#c8a45c] text-[#0a0f1e] font-semibold text-base h-12 shadow-lg shadow-[#c8a45c]/25 transition-all"
                >
                  使用飞书账号登录
                </Button>
                <p className="text-center text-xs text-white/25">
                  仅限授权团队成员访问 · 飞书扫码即可登录
                </p>
              </div>
            </div>
          </div>

          {/* Right: Image Showcase */}
          <div className="lg:w-[55%] flex items-center justify-center p-6 lg:p-12">
            <div className="w-full max-w-2xl">
              {/* Image Carousel */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/[0.08] bg-[#111827]">
                <div className="relative aspect-video">
                  {SHOWCASE_IMAGES.map((img, i) => (
                    <div
                      key={i}
                      className="absolute inset-0 transition-opacity duration-700"
                      style={{ opacity: currentSlide === i ? 1 : 0 }}
                    >
                      <img
                        src={img.url}
                        alt={img.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Gradient overlay at bottom */}
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#111827] to-transparent" />
                    </div>
                  ))}

                  {/* Navigation arrows */}
                  <button
                    onClick={prevSlide}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/70 hover:text-white transition-colors backdrop-blur-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/70 hover:text-white transition-colors backdrop-blur-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Caption bar */}
                <div className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white/80">
                      {SHOWCASE_IMAGES[currentSlide].title}
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">
                      {SHOWCASE_IMAGES[currentSlide].desc}
                    </div>
                  </div>
                  {/* Dots */}
                  <div className="flex gap-1.5">
                    {SHOWCASE_IMAGES.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => goToSlide(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          currentSlide === i
                            ? "bg-[#c8a45c] w-5"
                            : "bg-white/20 hover:bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats bar below image */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { value: "2,314", label: "全球企业" },
                  { value: "104", label: "覆盖国家" },
                  { value: "11", label: "覆盖大洲" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                  >
                    <div className="text-xl font-bold text-[#c8a45c]">{stat.value}</div>
                    <div className="text-xs text-white/35 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-4 border-t border-white/5 text-center">
          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} Universal Gourmand Group. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
