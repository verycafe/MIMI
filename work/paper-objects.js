    const cream=hex('#f4e9d9'),ink=hex('#30251b');

    function objects(pose,color){
      const root=mul(translate(pose.x*.022,-.25-pose.y*.025+(pose.sy-1)*.72,0),mul(rz(-pose.roll),mul(rx(-pose.pitch+.025),mul(ry(pose.yaw-.17),scale(pose.sx,pose.sy,1)))));
      const list=[],bodyColor=hex(color),dark=color.toLowerCase()==='#302a28';
      const iris=hex(dark?'#e7be35':color.toLowerCase()==='#d99728'?'#88925c':'#829459');
      const innerEar=hex(dark?'#d799a4':color.toLowerCase()==='#d99728'?'#db916e':'#c89f7e');
      const pink=hex('#d89193');
      const add=(mesh,local,c)=>list.push({mesh,model:mul(root,local),color:c,rough:.94,coat:0});
      add('headCoat',identity(),bodyColor);add('headCream',identity(),cream);
      add('earCoat',identity(),bodyColor);add('earPink',identity(),innerEar);
      add('earCoat',scale(-1,1,1),bodyColor);add('earPink',scale(-1,1,1),innerEar);
      for(const side of [-1,1]){
        const open=clamp((1-pose.w[2])*(1-pose.w[1]*pose.laugh)*pose.eyeOpen*(1-(side<0?pose.blinkL:pose.blinkR)),0,1);
        const eyeX=side*.46,eyeY=.004;
        if(open>.13){
          // Flat cut-paper circles: colour ring and pupil have a tiny real
          // thickness, while their large front faces stay completely flat.
          add('disc',mul(translate(eyeX,eyeY,.761),scale(.191,.210*open,.018)),iris);
          add('disc',mul(translate(eyeX+pose.lookX*.008,eyeY-pose.lookY*.008,.778),scale(.132,.150*open,.010)),ink);
        }else{
          add(pose.w[2]>.45?'sleepy':'happy',translate(eyeX,eyeY,.758),dark?iris:ink);
        }
      }
      add('muzzle',identity(),cream);
      add('nose',translate(0,-.210,.949),pink);
      add('stem',translate(0,-.252,.949),pink);
      add('mouth',translate(0,-.272,.949),pink);
      return list;
    }
