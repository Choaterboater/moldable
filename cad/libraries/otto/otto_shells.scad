// SPDX-License-Identifier: CC-BY-SA-4.0
// Moldable Otto prototype / Otto DIY https://www.ottodiy.com
include <otto_fit.scad>
use <otto_core.scad>

// Head silhouette seen from the front: top corners styled, bottom corners square
// so the bottom band drops into the body. Spans y = top-h .. top.
// Bevel corners stop at 8 mm and the dome is a fixed 13 (cavity 11): beyond that the raised shield's corners would touch them.
function head_corner(style,r) = style==2 ? min(r,8) : r;
module head_profile(w,h,top,r=4,style=1,dome=13) {
  rr=style==0?0:(style==3?min(dome,w/2-1,h/2-1):min(r,w/2-1,h/2-1));   // dome radius keeps the HC-SR04 board and the shield corners clear
  if(rr<=0) translate([-w/2,top-h]) square([w,h]);
  else hull() {
    translate([-w/2,top-h]) square([w,1]);
    for(s=[-1,1]) translate([s*(w/2-rr),top-rr])
      if(style==2) rotate(45) square(rr*sqrt(2),center=true); else circle(r=rr,$fn=48);
  }
}
function head_h(mouth) = otto_head[1];   // same for every mouth: fixed electronics bay
// Outer outline: styled (and grown) above the insert band, fixed band below it.
module head_outline(style,r,grow,mouth) {
  h=head_h(mouth);
  union() {
    head_profile(otto_head[0]+2*grow,h+grow-otto_head_insert,grow,head_corner(style,r),style);
    translate([-otto_head[0]/2,-h]) square([otto_head[0],otto_head_insert+0.01]);
  }
}
module head_cavity_outline(style,r,mouth) {
  head_profile(otto_head[0]-2*otto_wall,head_h(mouth)+1-otto_wall,-otto_wall,max(0,head_corner(style,r)-otto_wall),style,13-otto_wall);
}
// Ears sit on the head top, overlapping it by 3 mm.
module ears(style=0,edge=31,top=0) {
  if(style>0) for(side=[-1,1]) translate([side*(edge-12),top-3,0]) linear_extrude(6)
    if(style==2) polygon([[-9,0],[0,17],[9,0]]);
    else let(r=style==3?10:8) translate([0,r]) circle(r=r,$fn=32);
}
module antenna(height=0,top=0) {
  if(height>0) linear_extrude(6) union() {
    translate([-2,top-1]) square([4,height+1]);
    translate([0,top+height]) circle(r=4,$fn=24);
  }
}
module hats(style=0,top=0) {
  if(style>0) translate([0,top-2,0]) linear_extrude(6) union() {
    translate([-28,0]) square([56,5]);
    if(style==1) translate([-22,0]) square([44,12]);
    if(style==2) translate([-17,0]) square([34,25]);
    if(style==3) intersection() { circle(r=29,$fn=48); translate([-30,0]) square([60,30]); }
  }
}
// Head: face plate on the bed (local +Y is up on the robot, Y=0 the top).
// Open underside drops into the body; open rear is closed by head_cover_part.
function head_depth() = otto_head[2]-otto_wall;
module head_part(style=1,r=4,grow=0,ear=0,ant=0,hat=0,mouth=0,c=0.25) {
  union() {
  difference() {
    union() {
      difference() {
        linear_extrude(head_depth()) head_outline(style,r,grow,mouth);
        translate([0,0,otto_wall]) linear_extrude(head_depth()) head_cavity_outline(style,r,mouth);
      }
      ears(ear,otto_head[0]/2+grow,grow); antenna(ant,grow); hats(hat,grow);
      if(grow==0) head_snap();   // clip tabs below the insert band click into the body's side walls (thicker shells are 3.4x stiffer or more: plain slip fit)
    }
    // Behind the insert band the head rests on the body's rear rim instead.
    translate([-100,-head_h(mouth)-1,otto_head_band]) cube([200,otto_head_insert+1,100]);
    hcsr04_eyes(c);
    usbc_top_slot(c);
    // Pilots for the two ear screws that pin the back cover (one through each side wall).
    cover_screw_holes();
    if(mouth==0) translate([0,otto_nose_y,-1]) cylinder(d=otto_nose_d,h=otto_wall+2,$fn=32);
    if(mouth==1) oled_window(c);
    if(mouth==2) for(x=[-8,0,8]) translate([x,otto_grille_y,-1]) fit_box([3,8,otto_wall+2],c);
  }
  // Face mounts go in after the cavity cuts so the sensor and OLED are held to the face.
  hcsr04_mount(c);
  if(mouth==1) oled_mount(c);
  }
}
// Back cover: outside face on the bed. A U-shaped lip locates it in the head's
// open rear, one screw through each head side wall into a post on the cover pins it,
// and two edge clips carry the I/O shield. It sits behind the body, so it
// stops at the body rim (no insert band); the bottom stays open.
module head_cover_part(style=1,r=4,grow=0,mouth=0,c=0.25) {
  h=head_h(mouth); iw=otto_head[0]-2*otto_wall;
  difference() {
    union() {
      linear_extrude(otto_wall) difference() {
        head_outline(style,r,grow,mouth);
        translate([-200,-h-10]) square([400,10+otto_head_insert]);
        for(s=[-1,1]) translate([s*(otto_head[0]/2+grow),otto_cover_screw[0]]) rotate(45) square(otto_cover_mark[0],center=true);   // screw-height mark
      }
      translate([0,0,otto_wall-0.01]) linear_extrude(otto_cover_lip+0.01) difference() {
        offset(delta=-c) head_cavity_outline(style,r,mouth);
        offset(delta=-c-otto_wall) head_cavity_outline(style,r,mouth);
        translate([-iw,-h-10]) square([2*iw,10+otto_head_insert]);
      }
      shield_mount(c);
      cover_ribs(c);
      cover_posts(c);   // the two cross screws thread into these
    }
    cover_post_pilots(c);
  }
}
// Body: open-top box with chamfered vertical edges; hip servos stand on the floor.
module body_part(grow=0,c=0.25) {
  w=otto_body[0]+2*grow; d=otto_body[1]+2*grow; ch=otto_body_chamfer;
  union() {
  difference() {
    union() {
      difference() {
        linear_extrude(otto_body[2]) offset(delta=ch,chamfer=true) square([w-2*ch,d-2*ch],center=true);
        translate([0,0,otto_wall]) linear_extrude(otto_body[2]) square(otto_body_inner,center=true);
      }
      hip_posts(); battery_stops(c); buzzer_ring(c); if(grow==0) clip_bumps(); head_seats();
    }
    body_cavities(c,grow==0);   // the clip exists only on the standard shell
    buzzer_seat(c);
  }
  buzzer_ribs(c);
  }
}
// Leg prints top-down (z=0 is the top, against the body). Both legs are identical.
module leg_part(side=0,c=0.25) {
  ch=otto_leg_chamfer;
  difference() {
    union() {
      difference() {
        linear_extrude(otto_leg[2]) offset(delta=ch,chamfer=true) square([otto_leg[0]-2*ch,otto_leg[1]-2*ch],center=true);
        leg_cavities(c);
      }
      ankle_ear_block(c);
      ankle_knob();
    }
    ankle_ear_screw(c);
    leg_arm_slot();
    leg_cable_way();
  }
}
// Foot: flat sole, sitting outboard of the leg, with front/back pivot brackets.
// side 0 = left (sole toward -X), 1 = right.
module foot_sole2d(style=0) {
  if(style==0) offset(delta=3,chamfer=true) square([otto_foot[0]-6,otto_foot[1]-6],center=true);
  if(style==1) offset(r=8,$fn=40) square([otto_foot[0]+2-16,otto_foot[1]+4-16],center=true);
  if(style==2) offset(delta=4,chamfer=true) square([52-8,70-8],center=true);
}
module foot_part(side=0,style=0,c=0.25) {
  mirror([side==0?1:0,0,0]) difference() {
    union() {
      translate([otto_foot_outboard,0,0]) linear_extrude(otto_sole) foot_sole2d(style);
      foot_brackets();
    }
    foot_cavities(c);
  }
}
// Part numbers: 0 head, 1 body, 2/3 legs, 4/5 feet, 8 back cover (6 plate, 7 assembled).
module otto_single(part=0,headStyle=1,corner=4,grow=0,ear=0,ant=0,hat=0,mouth=0,feet=0,clearance=0.25) {
  if(part==0) head_part(headStyle,corner,grow,ear,ant,hat,mouth,clearance);
  if(part==1) body_part(grow,clearance);
  if(part==2 || part==3) leg_part(part==3?1:0,clearance);
  if(part==4 || part==5) foot_part(part==5?1:0,feet,clearance);
  if(part==8) head_cover_part(headStyle,corner,grow,mouth,clearance);
}
// Robot in walking pose, front facing -Y, every part on its real interface:
// feet on the ground, legs pivot between the foot brackets, leg tops against the hip
// servos' bosses, head dropped otto_head_insert into the body, cover flush at the rear.
function leg_bottom_z() = otto_sole+otto_ankle_gap;
function body_z() = leg_bottom_z()+otto_leg[2]+otto_hip_gap;
module otto_placed(part=0,headStyle=1,corner=4,grow=0,ear=0,ant=0,hat=0,mouth=0,feet=0,clearance=0.25) {
  head_bottom=body_z()+otto_body[2]-otto_head_insert; top=head_bottom+head_h(mouth); d=otto_head[2];
  face=-otto_head_band/2;   // face plane; the extra head depth goes to the rear
  if(part==2 || part==3) translate([otto_hip_x[part-2],otto_hip_y,body_z()-otto_hip_gap]) rotate([0,180,0])
    otto_single(part,headStyle,corner,grow,ear,ant,hat,mouth,feet,clearance);
  if(part==4 || part==5) translate([otto_hip_x[part-4],otto_hip_y,0])
    otto_single(part,headStyle,corner,grow,ear,ant,hat,mouth,feet,clearance);
  if(part==1) translate([0,0,body_z()]) otto_single(1,headStyle,corner,grow,ear,ant,hat,mouth,feet,clearance);
  // Head: face plate (local z=0) to the front, local y=0 at the head top.
  if(part==0) multmatrix([[-1,0,0,0],[0,0,1,face],[0,1,0,top],[0,0,0,1]])
    otto_single(0,headStyle,corner,grow,ear,ant,hat,mouth,feet,clearance);
  // Cover: outside face (local z=0) to the rear, flush with the head walls.
  if(part==8) multmatrix([[1,0,0,0],[0,0,-1,face+d],[0,1,0,top],[0,0,0,1]])
    otto_single(8,headStyle,corner,grow,ear,ant,hat,mouth,feet,clearance);
}
module otto_assembled(headStyle=1,corner=4,grow=0,ear=0,ant=0,hat=0,mouth=0,feet=0,clearance=0.25) {
  for(i=[0,1,2,3,4,5,8]) otto_placed(i,headStyle,corner,grow,ear,ant,hat,mouth,feet,clearance);
}
// Cut-away fit-test pieces, sliced from the production parts so they test exactly what will be printed:
//  kind 0 = half a leg, cut lengthwise and laid on its side: the ankle servo is laid into the open trough, which
//    shows its length, both ears, the ear block, the boss in the U-slot and the cable at the rear window;
//  kind 1 = one hip station of the body (floor, the two ear posts, the boss slot): the hip servo stands in it
//    shaft down.
module otto_fit_cut(kind=0,c=0.25) {
  if(kind==0) translate([0,0,otto_leg[0]/2]) rotate([0,-90,0]) intersection() { leg_part(0,c); translate([-50,-otto_leg[1]/2,-1]) cube([50,otto_leg[1],100]); }   // without the pivot knob: it would overhang with the piece on its side
  if(kind==1) translate([-otto_hip_x[1],0,0]) intersection() { body_part(0,c); translate([otto_hip_x[1]-9,otto_hip_y+otto_floor_cable[1],0]) cube([18,hip_case_y()+19-otto_hip_y-otto_floor_cable[1],otto_wall+otto_hip_post+0.8]); }   // starts behind the cable window
}
module otto_part(part=0,headStyle=1,corner=4,grow=0,ear=0,ant=0,hat=0,mouth=0,feet=0,clearance=0.25) {
  // Print plate: head + cover + body in a row, legs and feet below.
  positions=[[0,0,0],[143.75+4*grow,-10,0],[0,-105,0],[25,-105,0],[75,-105,0],[130,-105,0],[],[],[72+2*grow,0,0]];
  if(part==7) otto_assembled(headStyle,corner,grow,ear,ant,hat,mouth,feet,clearance);
  else if(part==6) for(i=[0,1,2,3,4,5,8]) translate(positions[i]) otto_single(i,headStyle,corner,grow,ear,ant,hat,mouth,feet,clearance);
  else otto_single(part,headStyle,corner,grow,ear,ant,hat,mouth,feet,clearance);
}
