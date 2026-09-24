  // Deliberately placed paper folds. A polygon has one normal shared by
  // all its triangles, so triangulation never adds spurious tiny facets.
  function face(data,points,center=[0,0,0],fixedNormal=null) {
    let n=fixedNormal||norm(cross(points[1].map((v,i)=>v-points[0][i]),points[2].map((v,i)=>v-points[0][i])));
    if(!fixedNormal) {
      const mid=points[0].map((_,k)=>points.reduce((s,p)=>s+p[k],0)/points.length-center[k]);
      if(dot(n,mid)<0)n=n.map(v=>-v);
    }
    for(let i=1;i<points.length-1;i++)for(const p of [points[0],points[i],points[i+1]])data.push(...p,...n);
  }
  function paperHead() {
    const coat=[],cream=[];
    const front=[[-.76,.44,.74],[.76,.44,.74],[1.03,-.30,.74],[.65,-.70,.74],[-.65,-.70,.74],[-1.03,-.30,.74]];
    const middle=front.map(p=>[p[0]*1.06,p[1]*1.06+.24,-.06]);
    const back=front.map(p=>[p[0]*.82,p[1]*.82+.15,-.65]);
    for(let i=0;i<6;i++) {
      const j=(i+1)%6,out=i>=2&&i<=4?cream:coat;
      face(out,[front[i],front[j],middle[j],middle[i]],[0,-.05,0]);
      face(out,[middle[i],middle[j],back[j],back[i]],[0,-.05,0]);
    }
    face(coat,back,[0,-.05,0]);
    const top=[0,.44,.74],peak=[0,.24,.74],left=[-.30,-.30,.74],right=[.30,-.30,.74];
    // The colour boundary partitions the front surface itself. There is no
    // second face shell and no stepped rim around the head.
    face(coat,[front[0],top,peak,left,front[5]],null,[0,0,1]);
    face(coat,[top,front[1],front[2],right,peak],null,[0,0,1]);
    face(cream,[left,peak,right],null,[0,0,1]);
    face(cream,[front[5],front[2],front[3],front[4]],null,[0,0,1]);
    return {headCoat:new Float32Array(coat),headCream:new Float32Array(cream)};
  }
  function paperEar() {
    const outer=[],inner=[];
    const a=[-.96,.53,.28],b=[-.33,.57,.38],c=[-.63,.68,-.25],tip=[-.86,1.34,-.03];
    const center=[a,b,c,tip].reduce((sum,p)=>sum.map((v,i)=>v+p[i]/4),[0,0,0]);
    face(inner,[a,b,tip],center);
    face(outer,[b,c,tip],center);face(outer,[c,a,tip],center);face(outer,[a,c,b],center);
    return {earCoat:new Float32Array(outer),earPink:new Float32Array(inner)};
  }
  function paperMuzzle() {
    const data=[];
    const front=[[-.175,-.13,.945],[.175,-.13,.945],[.175,-.38,.945],[-.175,-.38,.945]];
    const back=[[-.235,-.085,.747],[.235,-.085,.747],[.235,-.425,.747],[-.235,-.425,.747]];
    const center=[0,-.255,.84];
    face(data,front,center);
    for(let i=0;i<4;i++){const j=(i+1)%4;face(data,[front[i],front[j],back[j],back[i]],center);}
    face(data,back,center);
    return new Float32Array(data);
  }
  function paperDisc(segments=40) {
    const data=[],front=[],back=[];
    for(let i=0;i<segments;i++) {
      const angle=i/segments*2*PI;
      front.push([Math.cos(angle),Math.sin(angle),.5]);back.push([Math.cos(angle),Math.sin(angle),-.5]);
    }
    face(data,front,null,[0,0,1]);face(data,back,null,[0,0,-1]);
    for(let i=0;i<segments;i++){const j=(i+1)%segments;face(data,[front[i],front[j],back[j],back[i]]);}
    return new Float32Array(data);
  }
  function paperStroke(points,width) {
    const data=[];
    for(let i=0;i<points.length-1;i++) {
      const a=points[i],b=points[i+1],d=norm([-(b[1]-a[1]),b[0]-a[0],0]).map(v=>v*width/2);
      face(data,[a.map((v,k)=>v+d[k]),b.map((v,k)=>v+d[k]),b.map((v,k)=>v-d[k]),a.map((v,k)=>v-d[k])],null,[0,0,1]);
    }
    return new Float32Array(data);
  }
  let geometry;
  function geometries() {
    if(geometry)return geometry;
    const nose=[];face(nose,[[-.082,.035,0],[.082,.035,0],[0,-.047,0]],null,[0,0,1]);
    geometry={
      ...paperHead(),...paperEar(),muzzle:paperMuzzle(),disc:paperDisc(),nose:new Float32Array(nose),
      sleepy:paperStroke([[-.14,.015,0],[-.07,-.025,0],[0,-.04,0],[.07,-.025,0],[.14,.015,0]],.025),
      happy:paperStroke([[-.14,-.015,0],[-.07,.045,0],[0,.060,0],[.07,.045,0],[.14,-.015,0]],.025),
      mouth:paperStroke([[-.088,-.070,0],[0,0,0],[.088,-.070,0]],.022),
      stem:paperStroke([[0,0,0],[0,-.025,0]],.021)
    };
    return geometry;
  }
