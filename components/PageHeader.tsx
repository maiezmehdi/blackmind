import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon?: React.ElementType;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon: Icon }) => {
  return (
    <div className="space-y-2 shrink-0">
      <div className="flex items-center gap-2 text-gemini-dim text-[10px] font-bold uppercase tracking-[0.3em]">
        {Icon && <Icon size={14} />} {subtitle}
      </div>
      <h1 className="text-4xl md:text-5xl font-bold font-outfit text-gemini-accent tracking-tight">{title}</h1>
    </div>
  );
};

export default PageHeader;
