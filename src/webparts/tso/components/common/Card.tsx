import React from 'react';

interface CardProps {
  title: string;
  value: string | number;
  // FIX: Changed icon prop type to `React.ReactElement<any>` to resolve a TypeScript error with `React.cloneElement`. This explicitly allows passing new props like `className` to the cloned icon element.
  icon: React.ReactElement<any>;
  colors: {
    bg: string;
    icon: string;
  }
}

const Card: React.FC<CardProps> = ({ title, value, icon, colors }) => {
  return (
    <div className="card shadow-sm">
      <div className="card-body d-flex align-items-center justify-content-between">
        <div>
          <h6 className="card-subtitle text-body-secondary text-uppercase">{title}</h6>
          <p className="h2 card-title mb-0">{value}</p>
        </div>
        <div className={`p-3 rounded-circle ${colors.bg}`}>
          {React.cloneElement(icon, { className: `w-7 h-7 ${colors.icon}`, width: 32, height: 32 })}
        </div>
      </div>
    </div>
  );
};

export default Card;
