/* Mimi: hand-placed low-poly geometry and procedural matte-paper shading.
   Everything in this file is generated from equations. No model, texture,
   environment image, image generation service or third-party runtime. */
window.Cat3D = (() => {
  'use strict';
  const PI = Math.PI;
  const identity = () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
  const mul = (a,b) => {
    const m = new Array(16).fill(0);
    for(let c=0;c<4;c++) for(let r=0;r<4;r++) for(let k=0;k<4;k++) m[c*4+r] += a[k*4+r]*b[c*4+k];
    return m;
  };
  const translate = (x,y,z) => { const m=identity(); m[12]=x;m[13]=y;m[14]=z;return m; };
  const scale = (x,y,z) => [x,0,0,0,0,y,0,0,0,0,z,0,0,0,0,1];
  const rx = a => { const c=Math.cos(a),s=Math.sin(a);return [1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]; };
  const ry = a => { const c=Math.cos(a),s=Math.sin(a);return [c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]; };
  const rz = a => { const c=Math.cos(a),s=Math.sin(a);return [c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]; };
  const norm = v => { const l=Math.hypot(...v)||1;return v.map(x=>x/l); };
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const dot = (a,b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
  const ortho = (l,r,b,t,n,f) => [2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1];
  function lookAt(eye,target) {
    const z=norm(eye.map((n,i)=>n-target[i])),x=norm(cross([0,1,0],z)),y=cross(z,x);
    return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];
  }
  function hex(s) { return [1,3,5].map(i=>Math.pow(parseInt(s.slice(i,i+2),16)/255,2.2)); }
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
  const headContours = {
    classic: [[-.76,.44],[.76,.44],[1.03,-.30],[.65,-.70],[-.65,-.70],[-1.03,-.30]],
    broad: [[-.66,.51],[.66,.51],[.96,.24],[1.03,-.23],[.79,-.58],[.43,-.71],[-.43,-.71],[-.79,-.58],[-1.03,-.23],[-.96,.24]],
    wedge: [[-.70,.46],[.70,.46],[1.015,-.18],[.48,-.73],[-.48,-.73],[-1.015,-.18]],
    ruff: [[-.70,.46],[.70,.46],[.86,.12],[1.10,-.14],[.99,-.22],[1.12,-.34],[.94,-.38],[1.01,-.51],[.79,-.57],[.64,-.73],[.34,-.80],[-.34,-.80],[-.64,-.73],[-.79,-.57],[-1.01,-.51],[-.94,-.38],[-1.12,-.34],[-.99,-.22],[-1.10,-.14],[-.86,.12]]
  };
  function paperHead(kind) {
    const data=[],front=headContours[kind].map(([x,y])=>[x,y,.74]);
    const middle=front.map(p=>[p[0]*1.06,p[1]*1.06+.22,-.06]);
    const back=front.map(p=>[p[0]*.80,p[1]*.82+.14,-.65]);
    // One closed volume. Coat patterns are ink on this mesh, never another
    // offset head, border, face plate, or stepped silhouette.
    for(let i=0;i<front.length;i++) {
      const j=(i+1)%front.length;
      face(data,[[0,-.08,.74],front[i],front[j]],null,[0,0,1]);
      face(data,[front[i],front[j],middle[j],middle[i]],[0,-.05,0]);
      face(data,[middle[i],middle[j],back[j],back[i]],[0,-.05,0]);
      face(data,[[0,-.08,-.65],back[j],back[i]],null,[0,0,-1]);
    }
    return new Float32Array(data);
  }
  function paperEar(shape) {
    const outer=[],inner=[],cx=-shape.earX,w=shape.earWidth;
    const a=[cx-w/2,.36,.31],b=[cx+w/2,.54,.43],tip=[cx-w*.18,.54+shape.earHeight,-.025];
    const rear=[cx,.56,-.28];
    // The triangular inset and its border occupy the same plane.
    const towards=(p,q,t)=>p.map((v,i)=>v+(q[i]-v)*t);
    const front=[a,b,tip];
    const center=front.reduce((sum,p)=>sum.map((v,i)=>v+p[i]/front.length),[0,0,0]);
    const inset=front.map(p=>towards(center,p,.74));
    const normal=norm(cross(b.map((v,i)=>v-a[i]),tip.map((v,i)=>v-a[i])));
    for(let i=0;i<front.length;i++){
      const j=(i+1)%front.length;
      face(outer,[front[i],front[j],inset[j],inset[i]],null,normal);
      face(outer,[front[j],front[i],rear],center.map((v,k)=>(v+rear[k])/2));
    }
    face(inner,inset,null,normal);
    return {coat:new Float32Array(outer),inner:new Float32Array(inner)};
  }
  function paperMuzzle(shape) {
    const data=[],y=shape.muzzleY,z=.74+shape.muzzleDepth,w=shape.muzzleW;
    const h=.125;
    const front=[[-.175*w,y+h,z],[.175*w,y+h,z],[.175*w,y-h,z],[-.175*w,y-h,z]];
    const back=[[-.235*w,y+h*1.36,.742],[.235*w,y+h*1.36,.742],[.235*w,y-h*1.36,.742],[-.235*w,y-h*1.36,.742]];
    const center=[0,y,(z+.742)/2];
    face(data,front,center);
    for(let i=0;i<4;i++){const j=(i+1)%4;face(data,[front[i],front[j],back[j],back[i]],center);}
    face(data,back,center);
    return new Float32Array(data);
  }
  function paperDisc(segments=40,almond=false) {
    const data=[],front=[],back=[];
    for(let i=0;i<segments;i++) {
      const angle=i/segments*2*PI;
      const x=Math.cos(angle),s=Math.sin(angle),y=s*(almond&&s>0?.82+.18*Math.abs(x):1);
      front.push([x,y,.5]);back.push([x,y,-.5]);
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
      disc:paperDisc(),almond:paperDisc(40,true),nose:new Float32Array(nose),
      sleepy:paperStroke([[-.14,.015,0],[-.07,-.025,0],[0,-.04,0],[.07,-.025,0],[.14,.015,0]],.025),
      happy:paperStroke([[-.14,-.015,0],[-.07,.045,0],[0,.060,0],[.07,.045,0],[.14,-.015,0]],.025),
      mouth:paperStroke([[-.088,-.070,0],[0,0,0],[.088,-.070,0]],.022),
      stem:paperStroke([[0,0,0],[0,-.025,0]],.021)
    };
    for(const kind of Object.keys(headContours))geometry[`head-${kind}`]=paperHead(kind);
    for(const cat of CatCatalog){
      const ear=paperEar(cat.shape);
      geometry[`ear-${cat.id}`]=ear.coat;
      geometry[`inner-${cat.id}`]=ear.inner;
      geometry[`muzzle-${cat.id}`]=paperMuzzle(cat.shape);
    }
    return geometry;
  }
  const VERTEX=`#version 300 es
  precision highp float;
  layout(location=0) in vec3 aPosition;
  layout(location=1) in vec3 aNormal;
  uniform mat4 uModel,uViewProjection,uLightProjection;
  out vec3 vWorld,vNormal,vLocal;
  out vec4 vLight;
  void main(){
    vec4 world=uModel*vec4(aPosition,1.0);
    vWorld=world.xyz;
    vLocal=aPosition;
    vNormal=normalize(mat3(transpose(inverse(uModel)))*aNormal);
    vLight=uLightProjection*world;
    gl_Position=uViewProjection*world;
  }`;
  const FRAGMENT=`#version 300 es
  precision highp float;
  in vec3 vWorld,vNormal,vLocal;
  in vec4 vLight;
  uniform vec3 uColor;
  uniform sampler2D uShadow;
  out vec4 fragColor;
  ${window.CatCoatShader}
  float hashPaper(vec3 p){
    p=fract(p*vec3(.1031,.1030,.0973));
    p+=dot(p,p.yxz+33.33);
    return fract((p.x+p.y)*p.z);
  }
  float paperNoise(vec3 p){
    vec3 i=floor(p),f=fract(p);
    f=f*f*(3.-2.*f);
    return mix(mix(mix(hashPaper(i),hashPaper(i+vec3(1,0,0)),f.x),
                   mix(hashPaper(i+vec3(0,1,0)),hashPaper(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hashPaper(i+vec3(0,0,1)),hashPaper(i+vec3(1,0,1)),f.x),
                   mix(hashPaper(i+vec3(0,1,1)),hashPaper(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float visibility(vec3 n,vec3 l){
    vec3 p=vLight.xyz/vLight.w*.5+.5;
    if(p.x<0.||p.x>1.||p.y<0.||p.y>1.||p.z>1.)return 1.;
    float bias=max(.0012*(1.-dot(n,l)),.00045),lit=0.;
    for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){
      float d=texture(uShadow,p.xy+vec2(float(x),float(y))*2.2/1024.).r;
      lit+=p.z-bias<=d?1.:0.;
    }
    return .30+.70*lit/9.;
  }
  vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
  void main(){
    // Each paper panel keeps its geometric normal and one clear plane of light.
    // There are no reflected softboxes or clear-coat highlights on the cardstock.
    vec3 n=normalize(vNormal);
    vec3 key=normalize(vec3(-3.4,5.,4.)),fill=normalize(vec3(3.,1.,3.));
    float shadow=visibility(n,key);
    vec3 diffuse=mix(vec3(.25,.19,.15),vec3(.46,.43,.39),n.y*.5+.5);
    diffuse+=vec3(1.,.94,.85)*max(dot(n,key),0.)*1.03*shadow;
    diffuse+=vec3(1.,.85,.73)*max(dot(n,fill),0.)*.19;
    // Object-space fibers move with the cat. Fade subpixel grain at small sizes.
    float footprint=length(fwidth(vLocal));
    float fineFade=1.-smoothstep(.0017,.008,footprint);
    float fiberFade=1.-smoothstep(.003,.014,footprint);
    float grain=(paperNoise(vLocal*vec3(175.,205.,190.))-.5)*.12*fineFade;
    grain+=(paperNoise(vLocal*vec3(48.,225.,81.)+vec3(12.7))-.5)*.045*fiberFade;
    grain+=(paperNoise(vLocal*34.+vec3(3.8))-.5)*.025;
    vec3 linear=coatColor(vLocal)*diffuse*(1.+grain);
    fragColor=vec4(pow(aces(linear),vec3(1./2.2)),1.);
  }`;
  const DEPTH_VERTEX=`#version 300 es
    precision highp float;layout(location=0)in vec3 aPosition;
    uniform mat4 uModel,uLightProjection;
    void main(){gl_Position=uLightProjection*uModel*vec4(aPosition,1.);}`;
  const DEPTH_FRAGMENT=`#version 300 es
    precision highp float;void main(){}`;

  function create(canvas) {
    const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:true});
    if(!gl)throw new Error('当前浏览器未启用 WebGL 2，无法显示立体猫咪。');
    const resources={programs:[],buffers:[],vaos:[],textures:[],framebuffers:[]};
    let destroyed=false;
    function destroy(){
      if(destroyed)return;
      destroyed=true;
      for(const value of resources.vaos)gl.deleteVertexArray(value);
      for(const value of resources.buffers)gl.deleteBuffer(value);
      for(const value of resources.framebuffers)gl.deleteFramebuffer(value);
      for(const value of resources.textures)gl.deleteTexture(value);
      for(const value of resources.programs)gl.deleteProgram(value);
      for(const values of Object.values(resources))values.length=0;
    }
    try {
    function program(vs,fs){
      const shaders=[];
      const compile=(type,src)=>{const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)||'无法编译头像着色器。');return s;};
      const p=gl.createProgram();resources.programs.push(p);
      try{
        const v=compile(gl.VERTEX_SHADER,vs),f=compile(gl.FRAGMENT_SHADER,fs);
        gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);
        if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p)||'无法连接头像着色器。');
        return {p,uniforms:new Proxy({}, {get:(o,k)=>k in o?o[k]:(o[k]=gl.getUniformLocation(p,k))})};
      }finally{for(const shader of shaders)gl.deleteShader(shader);}
    }
    const main=program(VERTEX,FRAGMENT),depth=program(DEPTH_VERTEX,DEPTH_FRAGMENT),meshes={};
    for(const [key,vertices]of Object.entries(geometries())){
      const vao=gl.createVertexArray(),buffer=gl.createBuffer();
      resources.vaos.push(vao);resources.buffers.push(buffer);
      gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);
      gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,24,12);
      meshes[key]={vao,buffer,count:vertices.length/6};
    }
    const shadowTexture=gl.createTexture();resources.textures.push(shadowTexture);gl.bindTexture(gl.TEXTURE_2D,shadowTexture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,1024,1024,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const shadowFbo=gl.createFramebuffer();resources.framebuffers.push(shadowFbo);gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,shadowTexture,0);
    gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    const lightProjection=mul(ortho(-2.2,2.2,-2.2,2.2,.1,16),lookAt([-3.4,5,4],[0,0,0]));
    const viewProjection=mul(ortho(-1.75,1.75,-1.75,1.75,.1,20),lookAt([0,0,6],[0,0,0]));
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
    const cats=new Map(CatCatalog.map(cat=>[cat.id,cat]));
    const colors=new Map(CatCatalog.map(cat=>[cat.id,{
      coat:hex(cat.coat),light:hex(cat.light),mark:hex(cat.marking),second:hex(cat.secondary),
      iris:hex(cat.iris),pupil:hex(cat.pupil),nose:hex(cat.nose),ear:hex(cat.ear),
      muzzle:hex(cat.muzzle),ears:cat.earCoats.map(hex)
    }]));

    function objects(pose,catId){
      const cat=cats.get(catId)||CatCatalog[0],s=cat.shape,c=colors.get(cat.id);
      // Cream uses the original unscaled head. Its paper silhouette stays
      // rigid during a hop, and a small nod avoids exposing a tall crown.
      const sx=s.rigid?1:pose.sx,sy=s.rigid?1:pose.sy;
      const pitch=s.rigid?clamp(pose.pitch,-.10,.10):pose.pitch;
      const root=mul(translate(pose.x*.022,-.25-pose.y*.025+(sy-1)*.72,0),mul(rz(-pose.roll),mul(rx(-pitch+.025),mul(ry(pose.yaw-.17),scale(sx*s.width,sy*s.height,s.depth)))));
      const list=[];
      const add=(mesh,local,color,pattern=0)=>list.push({mesh,model:mul(root,local),color,pattern,paint:c});
      add(`head-${s.kind}`,identity(),c.coat,cat.pattern);
      add(`ear-${cat.id}`,identity(),c.ears[0]);add(`inner-${cat.id}`,identity(),c.ear);
      add(`ear-${cat.id}`,scale(-1,1,1),c.ears[1]);add(`inner-${cat.id}`,scale(-1,1,1),c.ear);
      for(const side of [-1,1]){
        const open=clamp((1-pose.w[2])*(1-pose.w[1]*pose.laugh)*pose.eyeOpen*(1-(side<0?pose.blinkL:pose.blinkR)),0,1);
        const eyeX=side*s.eyeX,eyeY=s.eyeY,tilt=rz(side*s.eyeTilt),disc=cat.id==='american'?'almond':'disc';
        if(open>.13){
          // Flat cut-paper circles: colour ring and pupil have a tiny real
          // thickness, while their large front faces stay completely flat.
          add(disc,mul(translate(eyeX,eyeY,.761),mul(tilt,scale(s.eyeW,s.eyeH*open,.018))),c.iris);
          add(disc,mul(translate(eyeX+pose.lookX*.008,eyeY-pose.lookY*.008,.778),mul(tilt,scale(s.eyeW*.68,s.eyeH*.71*open,.010))),c.pupil);
        }else{
          add(pose.w[2]>.45?'sleepy':'happy',mul(translate(eyeX,eyeY,.758),mul(tilt,scale(s.eyeW/.191,1,1))),cat.id==='black'?c.iris:c.pupil);
        }
      }
      const noseZ=.74+s.muzzleDepth+.005;
      add(`muzzle-${cat.id}`,identity(),c.muzzle);
      add('nose',translate(0,s.muzzleY+.045,noseZ),c.nose);
      add('stem',translate(0,s.muzzleY+.003,noseZ),c.nose);
      add('mouth',translate(0,s.muzzleY-.017,noseZ),c.nose);
      return list;
    }
    function render(pose,catId,width,height,target=null){
      if(destroyed)throw new Error('头像渲染器已经释放。');
      const list=objects(pose,catId);
      gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFbo);gl.viewport(0,0,1024,1024);gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.useProgram(depth.p);gl.uniformMatrix4fv(depth.uniforms.uLightProjection,false,lightProjection);
      for(const obj of list){gl.bindVertexArray(meshes[obj.mesh].vao);gl.uniformMatrix4fv(depth.uniforms.uModel,false,obj.model);gl.drawArrays(gl.TRIANGLES,0,meshes[obj.mesh].count);}
      gl.bindFramebuffer(gl.FRAMEBUFFER,target);gl.viewport(0,0,width,height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.useProgram(main.p);gl.uniformMatrix4fv(main.uniforms.uViewProjection,false,viewProjection);gl.uniformMatrix4fv(main.uniforms.uLightProjection,false,lightProjection);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,shadowTexture);gl.uniform1i(main.uniforms.uShadow,0);
      for(const obj of list){
        gl.bindVertexArray(meshes[obj.mesh].vao);gl.uniformMatrix4fv(main.uniforms.uModel,false,obj.model);
        gl.uniform3fv(main.uniforms.uColor,obj.color);
        gl.uniform1i(main.uniforms.uPattern,obj.pattern);
        gl.uniform3fv(main.uniforms.uLightColor,obj.paint.light);
        gl.uniform3fv(main.uniforms.uMarkColor,obj.paint.mark);
        gl.uniform3fv(main.uniforms.uSecondColor,obj.paint.second);
        gl.drawArrays(gl.TRIANGLES,0,meshes[obj.mesh].count);
      }
      gl.bindVertexArray(null);
    }
    function exportCanvas(pose,catId,size=1024){
      if(destroyed)throw new Error('头像渲染器已经释放。');
      const limit=Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE),gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));
      if(!Number.isInteger(size)||size<1||size>limit)throw new RangeError(`导出尺寸必须是 1 到 ${limit} 之间的整数。`);
      const fbo=gl.createFramebuffer(),texture=gl.createTexture(),rb=gl.createRenderbuffer();
      try{
      gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.bindRenderbuffer(gl.RENDERBUFFER,rb);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,size,size);
      gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,rb);
      if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('当前设备无法分配头像导出画布。');
      render(pose,catId,size,size,fbo);
      const pixels=new Uint8Array(size*size*4);gl.readPixels(0,0,size,size,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
      const output=canvas.ownerDocument.createElement('canvas');output.width=output.height=size;
      const ctx=output.getContext('2d'),img=ctx.createImageData(size,size);
      for(let y=0;y<size;y++)img.data.set(pixels.subarray((size-1-y)*size*4,(size-y)*size*4),y*size*4);
      ctx.putImageData(img,0,0);
      return output;
      }finally{
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.bindRenderbuffer(gl.RENDERBUFFER,null);
        gl.deleteFramebuffer(fbo);gl.deleteTexture(texture);gl.deleteRenderbuffer(rb);
      }
    }
    return {draw:(pose,catId,width=canvas.width,height=canvas.height)=>render(pose,catId,width,height),exportCanvas,destroy};
    }catch(error){destroy();throw error;}
  }
  return {create};
})();
