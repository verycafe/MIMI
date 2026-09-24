/* Fixed, geometric coat markings for the eight CatCatalog companions.
   Inject after the main fragment shader uniforms and before its main().
   The coordinates are the head's original local positions, before animation.
   All colors are supplied in linear space, like the existing uColor uniform. */
window.CatCoatShader = `
uniform int uPattern;
uniform vec3 uLightColor,uMarkColor,uSecondColor;

// Signed distances give the paint a crisp, approximately one-pixel AA edge.
// Markings change surface color only; they never add a shell or extra geometry.
float coatInside(float d){
  float aa=max(fwidth(d)*.65,.00045);
  return 1.-smoothstep(-aa,aa,d);
}
float coatAbove(float value,float edge){return coatInside(edge-value);}
float coatBelow(float value,float edge){return coatInside(value-edge);}
float coatLine(vec2 p,vec2 a,vec2 b,float radius){
  vec2 ab=b-a;
  float t=clamp(dot(p-a,ab)/dot(ab,ab),0.,1.);
  return coatInside(length(p-a-ab*t)-radius);
}
float coatBand(float value,float center,float width){
  return coatInside(abs(value-center)-width);
}
float coatForehead(vec2 p,float width){
  // The M is entirely above the eyes, occupying the original crown surface.
  float mark=coatLine(p,vec2(-.40,.265),vec2(-.29,.625),width);
  mark=max(mark,coatLine(p,vec2(-.29,.625),vec2(0.,.375),width));
  mark=max(mark,coatLine(p,vec2(0.,.375),vec2(.29,.625),width));
  mark=max(mark,coatLine(p,vec2(.29,.625),vec2(.40,.265),width));
  mark=max(mark,coatLine(p,vec2(0.,.535),vec2(0.,.82),width*.86));
  return mark;
}
float coatCheeks(vec2 p,float width,float extra){
  vec2 q=vec2(abs(p.x),p.y);
  float mark=coatLine(q,vec2(.665,-.135),vec2(1.13,-.245),width);
  mark=max(mark,coatLine(q,vec2(.635,-.315),vec2(1.04,-.465),width*.92));
  if(extra>.5){
    mark=max(mark,coatLine(q,vec2(.69,.12),vec2(1.10,.17),width*.79));
    mark=max(mark,coatLine(q,vec2(.63,-.48),vec2(.89,-.64),width*.78));
  }
  return mark;
}
float coatWrappedStripes(vec3 p,float width,float density){
  // A continuous coordinate around the sides and occiput. No repeated image map.
  float height=p.y+.075*sin(p.z*4.2)+.045*abs(p.x);
  float stripe=coatBand(height,.48,width);
  stripe=max(stripe,coatBand(height,.225,width));
  stripe=max(stripe,coatBand(height,-.04,width));
  stripe=max(stripe,coatBand(height,-.305,width));
  stripe=max(stripe,coatBand(height,-.56,width*.85));
  if(density>.5){
    stripe=max(stripe,coatBand(height,.35,width*.74));
    stripe=max(stripe,coatBand(height,.09,width*.76));
    stripe=max(stripe,coatBand(height,-.17,width*.76));
    stripe=max(stripe,coatBand(height,-.435,width*.73));
  }
  float side=max(coatAbove(abs(p.x),.80),coatBelow(p.z,.17));
  return stripe*side;
}
float coatChin(vec3 p,float width,float top){
  // A small trapezoid underneath the muzzle, never a white forehead blaze.
  float edge=width+max(0.,top-p.y)*.34;
  return coatInside(max(abs(p.x)-edge,p.y-top))*coatAbove(p.z,.18);
}

vec3 coatColor(vec3 p){
  if(uPattern==0)return uColor;
  float front=coatAbove(p.z,.26);
  vec2 face=p.xy;
  float ax=abs(p.x);

  if(uPattern==1){
    // American shorthair: silver ground, bold M, paired cheek bars and
    // the large closed flank loops of a classic/blotched tabby.
    vec3 color=mix(uColor,uLightColor,coatChin(p,.37,-.37));
    float marking=max(coatForehead(face,.047),coatCheeks(face,.044,0.))*front;
    marking=max(marking,coatLine(face,vec2(-.64,.31),vec2(-.59,.72),.038)*front);
    marking=max(marking,coatLine(face,vec2(.64,.31),vec2(.59,.72),.038)*front);
    float loop=length(vec2((p.y+.06)/.40,(p.z+.16)/.49));
    float flank=coatBand(loop,1.,.18)*coatAbove(ax,.71);
    float rear=coatBelow(p.z,.12);
    float spine=coatBand(p.x,0.,.074);
    spine=max(spine,coatBand(p.x+.08*p.y,-.30,.060));
    spine=max(spine,coatBand(p.x-.08*p.y,.30,.060));
    marking=max(marking,flank);
    marking=max(marking,spine*rear);
    return mix(color,uMarkColor,marking);
  }

  if(uPattern==2){
    // Ginger stays orange over the nose bridge; cream is confined to the chin.
    vec3 color=mix(uColor,uLightColor,coatChin(p,.27,-.465));
    float marking=max(coatForehead(face,.025),coatCheeks(face,.024,0.))*front;
    marking=max(marking,coatLine(face,vec2(-.60,.32),vec2(-.55,.70),.024)*front);
    marking=max(marking,coatLine(face,vec2(.60,.32),vec2(.55,.70),.024)*front);
    marking=max(marking,coatWrappedStripes(p,.025,0.));
    return mix(color,mix(uSecondColor,uMarkColor,.67),marking);
  }

  if(uPattern==3){
    // Brown mackerel tabby: more numerous, distinctly narrower dark lines.
    vec3 color=mix(uColor,uLightColor,coatChin(p,.31,-.405));
    float marking=max(coatForehead(face,.026),coatCheeks(face,.025,1.))*front;
    marking=max(marking,coatLine(face,vec2(-.55,.285),vec2(-.49,.70),.021)*front);
    marking=max(marking,coatLine(face,vec2(.55,.285),vec2(.49,.70),.021)*front);
    marking=max(marking,coatLine(face,vec2(-.72,.32),vec2(-.69,.64),.018)*front);
    marking=max(marking,coatLine(face,vec2(.72,.32),vec2(.69,.64),.018)*front);
    marking=max(marking,coatWrappedStripes(p,.022,1.));
    return mix(color,uMarkColor,marking);
  }

  if(uPattern==4){
    // Seal bicolor ragdoll. Both blue eyes sit in the seal mask; the white
    // inverted V starts between the brows, widening into the lower cheeks.
    vec3 color=mix(uLightColor,uSecondColor,coatBelow(p.z,.20));
    float top=p.y-(.47-.13*ax);
    float bottom=(-.29-.065*ax)-p.y;
    float mask=coatInside(max(top,bottom))*coatAbove(p.z,.02);
    float whiteV=coatInside(ax-(.030+(.405-p.y)*.69));
    float whiteCheeks=coatBelow(p.y,-.355);
    mask*=1.-max(whiteV,whiteCheeks);
    color=mix(color,uMarkColor,mask);
    // The crown above the mask remains light, including the space between ears.
    return color;
  }

  if(uPattern==5){
    // Calico tabby: two unequal, angular patches painted into a white head.
    // Extending the inequalities through z carries the patches around the back.
    vec3 color=uLightColor;
    float orangeEdge=p.x-(-.115+.34*p.y+.10*p.z);
    float orangeBottom=(-.345+.115*p.x)-p.y;
    float orange=coatInside(max(orangeEdge,orangeBottom));
    float darkEdge=(.225-.22*p.y-.18*p.z)-p.x;
    float darkBottom=(-.27+.28*p.x)-p.y;
    float dark=coatInside(max(darkEdge,darkBottom));
    // A smaller orange patch wraps the lower right rear, away from the white chin.
    float rearOrange=coatInside(max(max(.12-p.x,p.y+.27),p.z+.22));
    orange=max(orange,rearOrange);
    color=mix(color,uSecondColor,orange);
    color=mix(color,uMarkColor,dark);
    float bars=coatForehead(face,.027)*front;
    bars=max(bars,coatCheeks(face,.025,0.)*front);
    bars=max(bars,coatWrappedStripes(p,.030,0.));
    // Short tabby bars stay inside the orange pigment, without crossing white.
    return mix(color,mix(uSecondColor,uMarkColor,.76),bars*orange*(1.-dark));
  }

  if(uPattern==6){
    // Black-and-white: one large left eye patch, a smaller right crown patch,
    // and a separate back patch. The right cheek and central muzzle stay white.
    float leftEdge=p.x-(-.19-.15*p.y+.045*p.z);
    float leftBottom=(-.30+.30*(p.x+.46))-p.y;
    float left=coatInside(max(leftEdge,leftBottom));
    float rightTop=coatInside(max(max(.28-p.x,p.x-.80),(.31+.42*(p.x-.36))-p.y));
    rightTop*=coatAbove(p.z,.02);
    float rear=coatInside(max(max(.09-p.x,-.41-p.y),p.z+.23));
    float marking=max(left,max(rightTop,rear));
    return mix(uLightColor,uMarkColor,marking);
  }

  return uColor;
}
`;
