// Independent solid component envelopes, intentionally NOT calls to cavity modules.
// Coordinates correspond to the prototype design, not purchased-hardware certification.
// Each part's own print frame: head/cover Y=0 is the head top; leg Z=0 is the leg top.
module dummy_box(size, pos) { translate(pos) cube(size,center=true); }
module otto_dummy(part,id) {
  if(part==0) {
    if(id==0) dummy_box([42,60,32],[0,-33.5,46.75]); // upright I/O shield + Nano + plugs + solder side
    if(id==1) dummy_box([12.35,32,6.5],[0,12.5,47.45]); // Type-C plug boot, up through the head top
    if(id==2) { dummy_box([45,20,4],[0,-15,14]); for(x=[-13.25,13.25]) translate([x,-15,0]) cylinder(d=16,h=12,$fn=48);
      dummy_box([12,20,5],[0,-35,14.75]); } // HC-SR04 + downward Dupont plugs
    if(id==3) { dummy_box([27,27,4],[0,-40,4]); dummy_box([12,4.5,22.5],[0,-51.25,17.25]); } // OLED, header at the bottom + rear plugs
  }
  if(part==1) {
    for(s=[0,1]) if(id==s) translate([s==0?-22:22,0,0]) { // hip servo, shaft down
      dummy_box([12.2,22.8,22.7],[0,5.5,13.35]);
      dummy_box([12.2,32.5,2.5],[0,5.5,7.45]); // mounting ears
    }
    if(id==2) dummy_box([17.5,48.5,26.5],[0,-3.75,15.25]); // 9V battery
    if(id==3) dummy_box([18,8,20],[0,24.5,12]); // provisional snap/wire allowance
    if(id==4) translate([-18,27,0]) cylinder(d=8,h=10,$fn=32);
    if(id==5) dummy_box([13,9,10],[17,27,5]);
    if(id==6) translate([-21,-22,2]) cylinder(d=12,h=9.5,$fn=48); // buzzer on the floor
  }
  if(part==2 || part==3) {
    if(id==0) { dummy_box([12.2,22.7,22.8],[0,0,22]); dummy_box([12.2,2.5,32.5],[0,-5.9,22]); } // ankle servo + ears
    if(id==1) cylinder(d=7,h=2,$fn=32); // hip horn hub
  }
  if(part==4 || part==5) {
    if(id==0) translate([0,-16,17]) rotate([90,0,0]) cylinder(d=7,h=1.5,$fn=32); // ankle horn hub
    if(id==1) translate([0,20,17]) rotate([90,0,0]) cylinder(d=2.5,h=5,$fn=24); // pivot pin
  }
  if(part==8) if(id==0) { // I/O shield on the cover posts: PCB + stack, solder side clear of the top screw holes
    dummy_box([42,60,30],[0,-33.5,23.75]);
    dummy_box([42,53.4,2],[0,-36.8,7.75]);
    dummy_box([29,6.6,2],[0,-6.8,7.75]);
  }
}
