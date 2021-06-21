
void main(){
    // displacement
    vec3 displaced=offset;
    // randomise
    displaced.xy+=vec2(random(pindex)-.5,random(offset.x+pindex)-.5)*uRandom;
    float rndz=(random(pindex)+snoise_1_2(vec2(pindex*.1,uTime*.1)));
    displaced.z+=rndz*(random(pindex)*2.*uDepth);
    
    // particle size
    float psize=(snoise_1_2(vec2(uTime,pindex)*.5)+2.);
    psize*=max(grey,.2);
    psize*=uSize;
    
    // (...)
}