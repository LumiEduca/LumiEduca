import React from 'react';

export default function DemoTitulo({ etiqueta, antes, destaque, sub }) {
  return (
    <div className="demo-tit">
      {etiqueta && <span className="demo-tit-etiqueta">{etiqueta}</span>}
      <h1 className="demo-tit-h1">
        {antes} <span>{destaque}</span>
      </h1>
      <div className="demo-tit-linha"><i /><b /><i /></div>
      {sub && <p className="demo-tit-sub">{sub}</p>}
    </div>
  );
}