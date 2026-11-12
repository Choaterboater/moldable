// Independent solid component envelopes, intentionally NOT calls to cavity modules.
// Coordinates correspond to the prototype design, not purchased-hardware certification.
// Each part's own print frame: head/cover Y=0 is the head top; leg Z=0 is the leg top.
module dummy_box(size, pos) { translate(pos) cube(size,center=true); }
module otto_dummy(part,id) {
  if(part==0) {
    if(id==0) { // upright blue IO shield: PCB + solder side, Nano + plugs inside the edge strips, DC jack and USB-C up top
      dummy_box([53.2,54.8,3.6],[0,-33.65,60.95]); dummy_box([44.2,54.8,28.4],[0,-33.65,44.95]);
      dummy_box([9.9,3.2,11.4],[15.35,-4.65,53.45]); dummy_box([9,3,3.2],[0,-4.75,47.45]);
    }
    if(id==1) dummy_box([12.35,31.75,6.5],[0,12.625,47.45]); // Type-C plug boot, from the port up through the head top
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
      hull() { translate([0,0,-2.4]) cylinder(d=12.2,h=5.6,$fn=48); translate([0,5,-2.4]) cylinder(d=9,h=5.6,$fn=32); } // boss + raised gear housing, through the floor
      translate([0,0,-6.4]) cylinder(d=4.8,h=4.1,$fn=24); // output spline under the floor
    }
    if(id==2) dummy_box([30,56,28],[0,-2.5,16]); // 4xAA two-layer holder
    if(id==3) dummy_box([8,6,22],[0,28.5,15.5]); // holder leads leaving the rear end
    if(id==4) { dummy_box([13,8,24],[24.5,-25.5,10]); dummy_box([15,10.5,4],[24.5,-25.5,-2]); } // rocker switch + flange under the floor
    if(id==5) difference() { // buzzer on the floor; the four crush-rib zones are deliberate interference
      translate([-24.75,-25.5,2]) cylinder(d=12,h=9.5,$fn=48);
      for(a=[0,90,180,270]) translate([-24.75,-25.5,0]) rotate(a) translate([5.8,-0.6,0]) cube([0.3,1.2,20]);
    }
  }
  if(part==2 || part==3) { // leg-local: z=0 is the leg top, ankle axis z 31, case centre z 25.5, ear seat y -9
    if(id==0) { // ankle servo, shaft forward, far ear against the block. The flat top is drawn anywhere from 3.0 to
      // 4.5 in front of the ear (drawing: 3.17), boss + raised gear housing through the U-slot, spline beyond.
      dummy_box([12.2,25.6,23.16],[0,-0.6,25.6]); dummy_box([12.2,2.95,33.4],[0,-7.475,25.6]);   // case end 0.02 above the block (z 14)
      translate([0,-12,31]) rotate([90,0,0]) { hull() { cylinder(d=12.2,h=5.9,$fn=48); translate([0,-5,0]) cylinder(d=9,h=5.9,$fn=32); } cylinder(d=4.8,h=10,$fn=24); }
    }
    if(id==1) { // hip horn inside the leg under the plate: hub up through the plate, UNCUT arm toward the rear and
      // out through the rear wall, screw head below. Drawn from seated to 0.8 lower.
      translate([0,0,-0.2]) cylinder(d=6.8,h=5.6,$fn=32);
      translate([0,0,2.54]) linear_extrude(2.86) polygon([[-2.8,0],[2.8,0],[2,17.9],[-2,17.9]]);
      translate([0,0,5.4]) cylinder(d=4.4,h=1.6,$fn=24);
    }
  }
  if(part==4 || part==5) { // foot-local: ankle axis z 20, front bracket inner face y -18, pocket floor y -22
    if(id==0) translate([0,-18,20]) rotate([90,0,0]) { // ankle horn in the keyhole: hub 0.4 proud of the bracket,
      // UNCUT arm pointing down into the sole, screw head in the web
      // (hub seated on the boss at y -16.5, or up to 0.6 off it)
      translate([0,0,-1.5]) cylinder(d=6.8,h=5.45,$fn=32);
      translate([0,0,1.24]) linear_extrude(2.71) mirror([0,1]) polygon([[-2.8,0],[2.8,0],[2,17.9],[-2,17.9]]);
      translate([0,0,3.32]) cylinder(d=4.4,h=2.2,$fn=24);
    }
    // ankle servo boss + raised gear housing, as far forward as an ear 4.5 behind the flat top would put it
    if(id==1) translate([0,-16.4,20]) rotate([90,0,0]) hull() { cylinder(d=12.2,h=1.5,$fn=48); translate([0,5,0]) cylinder(d=9,h=1.5,$fn=32); }
  }
  if(part==8) if(id==0) { // IO shield on the cover clips: solder side, PCB, Nano + plugs inside the edge strips, jack, USB-C
    difference() { // tails inside the ledges and clear of the peg bases; PCB with its two top mounting holes
      union() { dummy_box([50.2,54.8,3],[0,-33.65,7.25]); dummy_box([53.2,54.8,1.6],[0,-33.65,9.55]); }
      for(h=[[-23.9,-9.05],[23.9,-10.25]]) { translate([h[0],h[1],5]) cylinder(d=4.7,h=3.8,$fn=32); translate([h[0],h[1],5]) cylinder(d=3.2,h=10,$fn=32); }
    }
    dummy_box([44.2,54.8,28.4],[0,-33.65,24.55]);
    dummy_box([9.9,3.2,11.4],[-15.35,-4.65,16.05]); dummy_box([9,3,3.2],[0,-4.75,22.05]);
  }
}
