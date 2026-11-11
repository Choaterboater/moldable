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
      for(x=[-13.6,13.6]) translate([x,-15,-5]) cylinder(d=16,h=12,$fn=48);
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
    for(s=[0,1]) if(id==s) translate([s==0?-22:22,0,0]) { // hip servo, shaft down, hanging on its ears (the user's ASKY MG90S:
      // case 23.2 x 12.2 x 24.2, ears 33.4 x 2.7 with their nearer face 3.17 below the flat top, boss 4.33, spline 4).
      // The flat top is drawn anywhere from the floor to 1.2 above it.
      dummy_box([12.2,23.2,25.4],[0,5.5,14.7]);
      dummy_box([12.2,33.4,2.7],[0,5.5,7.55]); // mounting ears on the 4.2 posts
      hull() { translate([0,0,-2.4]) cylinder(d=11.8,h=5.6,$fn=48); translate([0,5,-2.4]) cylinder(d=9,h=5.6,$fn=32); } // boss + raised gear housing, through the floor
      translate([0,0,-6.4]) cylinder(d=4.8,h=4.1,$fn=24); // output spline under the floor
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
    if(id==0) { // ankle servo, shaft forward: case 12.2 x 24.2 x 23.2, ears 33.4 long and anywhere from 3.0 to 6.2
      // behind the shaft face (measured 3.17 to 5.87), boss + raised gear housing through the U-slot, spline beyond
      dummy_box([12.2,24.2,23.2],[0,0,22]); dummy_box([12.2,3.2,33.4],[0,-7.5,22]);
      translate([0,-12.1,27.5]) rotate([90,0,0]) { hull() { cylinder(d=11.8,h=4.6,$fn=48); translate([0,-5,0]) cylinder(d=9,h=4.6,$fn=32); } cylinder(d=4.8,h=8.4,$fn=24); }
    }
    if(id==1) { // hip horn in its pocket, hub up, with its screw head inside the leg.
      // Arm at its nominal width (4.5 where it is cut); only the four crush-rib zones, which press 0.15 into it
      // on purpose, are left out.
      translate([0,0,-2]) cylinder(d=7,h=4,$fn=32);
      difference() {
        translate([0,0,0.5]) linear_extrude(1.5) polygon([[-3,0],[3,0],[2.25,11],[-2.25,11]]);
        for(m=[0,1]) mirror([m,0,0]) { translate([2.5,3.9,0]) cube([1,1,3]); translate([2.2,7.75,0]) cube([1,1,3]); }
      }
      translate([0,0,2]) cylinder(d=4.8,h=1.8,$fn=24);
    }
    if(id==2) translate([0,15.5,27.5]) rotate([90,0,0]) cylinder(d=2.2,h=3.2,$fn=24); // tip of the pivot screw in its bore, foot fully forward
  }
  if(part==4 || part==5) {
    if(id==0) translate([0,-17.5,18.5]) rotate([90,0,0]) { // ankle horn in the keyhole, placed from the spline tip outward:
      // 4 mm hub with a 1 mm closed end beyond the spline tip (shaft face -12.1, boss 4.33, spline 4), arm pointing
      // down, screw head in the web
      translate([0,0,-0.07]) cylinder(d=7,h=4,$fn=32);
      translate([0,0,2.43]) linear_extrude(1.5) mirror([0,1]) polygon([[-3,0],[3,0],[2.2,11],[-2.2,11]]);
      translate([0,0,3.93]) cylinder(d=4.8,h=1.5,$fn=24);
    }
    // ankle servo boss + raised gear housing in the gap between the leg and the front bracket
    if(id==1) translate([0,-12.1,18.5]) rotate([90,0,0]) hull() { cylinder(d=11.8,h=4.6,$fn=48); translate([0,5,0]) cylinder(d=9,h=4.6,$fn=32); }
  }
  if(part==8) if(id==0) { // IO shield on the cover clips: solder side, PCB, Nano + plugs inside the edge strips, jack, USB-C
    difference() { // tails inside the ledges and clear of the peg bases; PCB with its two top mounting holes
      union() { dummy_box([50.2,54.8,3],[0,-37.15,7.25]); dummy_box([53.2,54.8,1.6],[0,-37.15,9.55]); }
      for(h=[[-23.9,-12.55],[23.9,-13.75]]) { translate([h[0],h[1],5]) cylinder(d=4.7,h=3.8,$fn=32); translate([h[0],h[1],5]) cylinder(d=3.2,h=10,$fn=32); }
    }
    dummy_box([44.2,54.8,28.4],[0,-37.15,24.55]);
    dummy_box([9.9,4,11.4],[-15.35,-7.75,16.05]); dummy_box([9,3,3.2],[0,-8.25,22.05]);
  }
}
