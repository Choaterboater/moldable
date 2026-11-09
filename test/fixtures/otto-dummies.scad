// Independent solid component envelopes, intentionally NOT calls to cavity modules.
// Coordinates correspond to the prototype design, not purchased-hardware certification.
// Each part's own print frame: head/cover Y=0 is the head top; leg Z=0 is the leg top.
module dummy_box(size, pos) { translate(pos) cube(size,center=true); }
module otto_dummy(part,id) {
  if(part==0) {
    if(id==0) dummy_box([42,60,32],[0,-33.5,46.75]); // upright I/O shield + Nano + plugs + solder side
    if(id==1) dummy_box([12.35,32,6.5],[0,12.5,47.45]); // Type-C plug boot, up through the head top
    if(id==2) { // HC-SR04: board minus its corner holes (the face pegs pass), transducers, downward Dupont plugs
      difference() { dummy_box([45,20,4],[0,-15,14]); for(x=[-20.5,20.5], y=[-7,-23]) translate([x,y,0]) cylinder(d=2,h=30,$fn=16); }
      for(x=[-13.25,13.25]) translate([x,-15,0]) cylinder(d=16,h=12,$fn=48);
      dummy_box([12,20,5],[0,-35,14.75]);
    }
    if(id==3) { // OLED upside down: glass, PCB + rear parts minus holes, flex at the top edge, rear plugs at the bottom
      dummy_box([26.7,19.27,1.5],[0,-37.9,2.75]);
      difference() { dummy_box([27.3,27.8,2.5],[0,-37.9,4.75]); for(x=[-11.65,11.65], y=[-26,-49.8]) translate([x,y,0]) cylinder(d=2,h=30,$fn=16); }
      dummy_box([14,4.77,4],[0,-25.885,4]);
      dummy_box([12,4.5,22.5],[0,-50.3,17.25]);
    }
  }
  if(part==1) {
    for(s=[0,1]) if(id==s) translate([s==0?-22:22,0,0]) { // hip servo, shaft down
      dummy_box([12.2,22.8,22.7],[0,5.5,13.35]);
      dummy_box([12.2,32.5,2.5],[0,5.5,7.45]); // mounting ears
    }
    if(id==2) dummy_box([30,56,28],[0,-2.5,16]); // 4xAA two-layer holder
    if(id==3) dummy_box([8,6,22],[0,28.5,15.5]); // holder leads leaving the rear end
    if(id==4) { dummy_box([13,8,24],[24.5,-24,10]); dummy_box([15,10.5,4],[24.5,-24,-2]); } // rocker switch + flange under the floor
    if(id==5) difference() { // buzzer on the floor; the four crush-rib zones are deliberate interference
      translate([-24.75,-22,2]) cylinder(d=12,h=9.5,$fn=48);
      for(a=[0,90,180,270]) translate([-24.75,-22,0]) rotate(a) translate([5.8,-0.6,0]) cube([0.3,1.2,20]);
    }
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
