
import React, { useState } from 'react';
import { Check, X, Zap, Crown, Sparkles, Building2, Rocket } from 'lucide-react';
import { useCourseContext } from '../store/useCourseStore';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { SubscriptionTier } from '../types';

const PricingPage: React.FC = () => {
  const { t, currentUser, upgradeSubscription } = useCourseContext();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null);

  const handleUpgrade = (tier: SubscriptionTier) => {
    setLoadingTier(tier);
    setTimeout(() => {
      upgradeSubscription(tier);
      setLoadingTier(null);
      if (tier !== 'free') {
        // Show success animation or navigate
        navigate('/');
      }
    }, 1500);
  };

  const plans = [
    {
      id: 'free',
      name: t('pricing.plans.free.name'),
      desc: t('pricing.plans.free.desc'),
      price: t('pricing.plans.free.price'),
      icon: Zap,
      features: [
        { name: t('pricing.feat.unlimited'), included: false, limit: t('pricing.limitDaily') },
        { name: t('pricing.feat.flash'), included: true },
        { name: t('pricing.feat.pro'), included: false },
        { name: t('pricing.feat.video'), included: false },
        { name: t('pricing.feat.ar'), included: false },
        { name: t('pricing.feat.audio'), included: false },
        { name: t('pricing.feat.marketplace'), included: true },
      ],
      color: "bg-gemini-surface",
      buttonColor: "bg-gemini-surface border border-gemini-border text-gemini-text"
    },
    {
      id: 'creator',
      name: t('pricing.plans.creator.name'),
      desc: t('pricing.plans.creator.desc'),
      price: t('pricing.plans.creator.price'),
      popular: true,
      icon: Crown,
      features: [
        { name: t('pricing.feat.unlimited'), included: true },
        { name: t('pricing.feat.flash'), included: true },
        { name: t('pricing.feat.pro'), included: true },
        { name: t('pricing.feat.video'), included: false },
        { name: t('pricing.feat.ar'), included: true },
        { name: t('pricing.feat.audio'), included: true },
        { name: t('pricing.feat.marketplaceLow'), included: true },
      ],
      color: "bg-gradient-to-b from-gemini-surface to-gemini-accent/5 border-gemini-accent/20",
      buttonColor: "bg-gemini-accent text-gemini-bg"
    },
    {
      id: 'architect',
      name: t('pricing.plans.architect.name'),
      desc: t('pricing.plans.architect.desc'),
      price: t('pricing.plans.architect.price'),
      icon: Building2,
      features: [
        { name: t('pricing.feat.unlimited'), included: true },
        { name: t('pricing.feat.flash'), included: true },
        { name: t('pricing.feat.pro'), included: true },
        { name: t('pricing.feat.video'), included: true },
        { name: t('pricing.feat.ar'), included: true },
        { name: t('pricing.feat.audio'), included: true },
        { name: t('pricing.feat.support'), included: true },
        { name: t('pricing.feat.workspaces'), included: true },
      ],
      color: "bg-gemini-surface",
      buttonColor: "bg-gemini-text text-gemini-bg"
    }
  ];

  return (
    <div className="min-h-full p-4 md:p-10 max-w-7xl mx-auto space-y-12 pb-24 overflow-x-hidden no-scrollbar">
      
      {/* Header */}
      <div className="text-center space-y-2 py-10 flex flex-col items-center">
        <div className="flex items-center gap-2 text-gemini-dim text-[10px] font-bold uppercase tracking-[0.3em]">
          <Zap size={14} /> {t('pricing.subtitle')}
        </div>
        <h1 className="text-4xl md:text-6xl font-bold font-outfit text-gemini-accent tracking-tight leading-tight">
          {t('pricing.title')}
        </h1>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <span className={`text-sm font-bold uppercase tracking-widest ${!isYearly ? 'text-gemini-text' : 'text-gemini-dim'}`}>{t('pricing.monthly')}</span>
          <button 
            onClick={() => setIsYearly(!isYearly)}
            className="w-16 h-8 bg-gemini-surface border border-gemini-border rounded-full relative transition-all shadow-inner"
          >
            <div className={`absolute top-1 w-6 h-6 bg-gemini-accent rounded-full transition-all duration-300 shadow-md ${isYearly ? 'left-8' : 'left-1'}`}></div>
          </button>
          <span className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${isYearly ? 'text-gemini-text' : 'text-gemini-dim'}`}>
            {t('pricing.yearly')}
            <span className="text-[9px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full border border-green-500/20">{t('pricing.save20')}</span>
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {plans.map((plan) => {
          const isCurrent = currentUser?.subscription === plan.id;
          const finalPrice = isYearly ? Math.floor(parseInt(plan.price) * 12 * 0.8) : plan.price;
          
          return (
            <div 
              key={plan.id}
              className={`relative p-8 rounded-[3rem] border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl flex flex-col gap-6 group ${plan.color} ${plan.popular ? 'border-gemini-accent shadow-xl scale-105 z-10' : 'border-gemini-border shadow-lg'}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gemini-accent text-gemini-bg px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-2">
                  <Sparkles size={12} /> {t('pricing.mostPopular')}
                </div>
              )}

              <div className="space-y-4 text-center">
                <div className="w-16 h-16 mx-auto bg-gemini-bg rounded-2xl flex items-center justify-center text-gemini-accent shadow-sm border border-gemini-border">
                  <plan.icon size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-outfit text-gemini-text">{plan.name}</h3>
                  <p className="text-sm text-gemini-dim mt-1 h-10">{plan.desc}</p>
                </div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gemini-accent">{new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(Number(finalPrice))}</span>
                  <span className="text-gemini-dim text-sm uppercase font-bold tracking-widest">/{isYearly ? t('pricing.yearShort') : t('pricing.monthShort')}</span>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gemini-dim text-center border-b border-gemini-border pb-4">{t('pricing.features')}</p>
                <ul className="space-y-3">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      {feat.included ? (
                        <Check size={18} className="text-gemini-accent shrink-0 mt-0.5" />
                      ) : (
                        <X size={18} className="text-gemini-border shrink-0 mt-0.5" />
                      )}
                      <span className={feat.included ? 'text-gemini-text' : 'text-gemini-dim line-through decoration-gemini-border'}>
                        {feat.name}
                        {feat.limit && <span className="ml-1 text-[10px] bg-gemini-surface border border-gemini-border px-1.5 rounded text-gemini-dim">{feat.limit}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => !isCurrent && handleUpgrade(plan.id as SubscriptionTier)}
                disabled={isCurrent || loadingTier !== null}
                className={`w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-2 ${plan.buttonColor} ${isCurrent ? 'opacity-50 cursor-default' : 'hover:scale-105 active:scale-95'}`}
              >
                {loadingTier === plan.id ? (
                  <Rocket size={18} className="animate-spin" />
                ) : isCurrent ? (
                  t('pricing.currentPlan')
                ) : (
                  t('pricing.upgrade')
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-10">
        <p className="text-gemini-dim text-sm">
          {t('pricing.enterprise')} <a href="#" className="text-gemini-accent underline font-bold">{t('pricing.contact')}</a>.
        </p>
      </div>
    </div>
  );
};

export default PricingPage;
