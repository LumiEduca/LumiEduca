import React from 'react';
import feliz from '../../assets/images/lumi/lumi-feliz.png';
import comemorando from '../../assets/images/lumi/lumi-comemorando.png';
import pensando from '../../assets/images/lumi/lumi-pensando.png';
import incentivando from '../../assets/images/lumi/lumi-incentivando.png';
import estrela from '../../assets/images/lumi/lumi-estrela.png';

const POSES = { feliz, comemorando, pensando, incentivando, estrela };

export default function LumiMascote({ mensagem, humor = 'feliz' }) {
  const src = POSES[humor] || POSES.feliz;
  return (
    <div className="demo-lumi">
      <img src={src} alt="Lumi" className={`demo-lumi-img humor-${humor}`} />
      {mensagem && <div className="demo-lumi-balao">{mensagem}</div>}
    </div>
  );
}