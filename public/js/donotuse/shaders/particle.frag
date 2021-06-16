// particle.frag

void main(){
    // pixel color
    vec4 colA=texture2D(uTexture,puv);
    
    // greyscale
    float grey=colA.r*.21+colA.g*.71+colA.b*.07;
    vec4 colB=vec4(grey,grey,grey,1.);
    
    // circle
    float border=.3;
    float radius=.5;
    float dist=radius-distance(uv,vec2(.5));
    float t=smoothstep(0.,border,dist);
    
    // final color
    color=colB;
    color.a=t;
    
    // (...)
}