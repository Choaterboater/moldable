// Independent solid component envelopes, intentionally NOT calls to cavity modules.
// Coordinates correspond to the prototype design, not purchased-hardware certification.
// Each part's own print frame: head/cover Y=0 is the head top; leg Z=0 is the leg top.
module dummy_box(size, pos) { translate(pos) cube(size,center=true); }
module otto_dummy(part,id) {
  if(part==0) {
    if(id==0) { // upright blue IO shield: PCB + solder side, Nano + plugs inside the edge strips, DC jack and USB-C up top
      dummy_box([53.2,54.8,3.6],[0,-37.15,60.95]); dummy_box([44.2,54.8,28.4],[0,-37.15,44.95]);
      dummy_box([9.9,4,11.4],[15.35,-7.75,53.45]); dummy_box([9,3,3.2],[0,-8.25,47.45]);
    }
    if(id==1) dummy_box([12.35,35.25,6.5],[0,10.875,47.45]); // Type-C plug boot, from the port up through the head top
    if(id==2) { // HC-SR04: PCB 5 mm behind the face, rear parts inside its edges, eyes 5 mm proud, downward plugs
      dummy_box([45,20,1.6],[0,-15,7.8]); dummy_box([39,18,2.4],[0,-15,9.8]);
      for(x=[-13.5,13.5]) translate([x,-15,-5]) cylinder(d=16,h=12,$fn=48);
      dummy_box([12,20,5],[0,-35,9.75]);
    }
    if(id==3) { // OLED upside down: glass on the face, PCB, rear parts inside its edges, flex at the top edge, rear plugs at the bottom
      dummy_box([24.6,19.27,1.5],[0,-37.9,2.75]);
      dummy_box([24.8,27.05,1.6],[0,-37.9,4.3]); dummy_box([20,25,0.9],[0,-37.9,5.55]);
      dummy_box([14,4.39,4],[0,-26.07,4]);
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
  if(part==8) if(id==0) { // IO shield on the cover clips: solder side, PCB, Nano + plugs inside the edge strips, jack, USB-C
    dummy_box([53.2,54.8,2],[0,-37.15,7.75]); dummy_box([53.2,54.8,1.6],[0,-37.15,9.55]);
    dummy_box([44.2,54.8,28.4],[0,-37.15,24.55]);
    dummy_box([9.9,4,11.4],[-15.35,-7.75,16.05]); dummy_box([9,3,3.2],[0,-8.25,22.05]);
  }
}
