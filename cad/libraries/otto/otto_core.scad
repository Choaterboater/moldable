// SPDX-License-Identifier: CC-BY-SA-4.0
// Moldable Otto prototype, inspired by Otto DIY https://www.ottodiy.com
include <otto_fit.scad>

module fit_box(size, clearance=0) {
  translate([-size[0]/2-clearance,-size[1]/2-clearance,-clearance])
    cube([size[0]+2*clearance,size[1]+2*clearance,size[2]+2*clearance]);
}
// Horizontal hole profile with a 45-degree roof (point toward +Y) so it prints without support.
module teardrop2d(d) { circle(d=d,$fn=32); rotate(45) square(d/2); }
// Generic upright SG90 pocket (fit-test coupon).
module servo_pocket(clearance=0.25) {
  fit_box([otto_servo[0],otto_servo[1],100],clearance);
  translate([0,0,otto_servo[2]-6]) fit_box([otto_servo_ears,otto_servo[1],100],clearance);
  for(x=[-14,14]) translate([x,0,-1]) cylinder(d=2+2*clearance,h=40,$fn=24);
}
module horn_arm2d(clearance=0.25) {
  polygon([[-otto_horn_arm[0]/2-clearance,0],[otto_horn_arm[0]/2+clearance,0],
           [otto_horn_arm[1]/2+clearance,otto_horn_arm[2]+clearance],[-otto_horn_arm[1]/2-clearance,otto_horn_arm[2]+clearance]]);
}
// Single-arm horn pocket opening on the print bed (arm along +Y). Roofs slope at
// 45 degrees instead of bridging; the screw hole runs up into the part.
module horn_recess_bed(clearance=0.25) {
  r=otto_horn_hub/2+clearance;
  hull() {
    translate([0,0,-1]) cylinder(r=r,h=otto_horn_depth+1,$fn=40);
    translate([0,0,otto_horn_depth]) cylinder(r1=r,r2=0.1,h=r*1.1,$fn=40);
  }
  translate([0,0,-1]) linear_extrude(otto_horn_depth+0.99) horn_arm2d(clearance);   // top coplanar with the roof base
  // Gable roof over the arm, ending in a sharp ridge (no flat ceiling).
  a=otto_horn_arm[0]/2+clearance; b=otto_horn_arm[1]/2+clearance; l=otto_horn_arm[2]+clearance; d=otto_horn_depth-0.01;
  polyhedron([[-a,0,d],[a,0,d],[b,l,d],[-b,l,d],[0,0,d+a*1.1],[0,l,d+b*1.1]],
    [[0,1,2,3],[0,4,1],[3,2,5],[0,3,5,4],[1,4,5,2]]);
  translate([0,0,-1]) cylinder(d=otto_horn_screw+2*clearance,h=100,$fn=24);
}
// Horn pocket in a vertical wall, cut along -Y from y=0. Arm points down (-Z) and
// the hub has a teardrop roof, so nothing overhangs when the wall prints upright.
module horn_recess_wall(clearance=0.25) {
  rotate([90,0,0]) {
    translate([0,0,-0.01]) linear_extrude(otto_horn_depth+clearance+0.01) {
      teardrop2d(otto_horn_hub+2*clearance);
      mirror([0,1]) horn_arm2d(clearance);
    }
    linear_extrude(100) teardrop2d(otto_horn_screw+2*clearance);
  }
}
module pivot_hole(clearance=0.25) { rotate([90,0,0]) translate([0,0,-50]) linear_extrude(100) teardrop2d(otto_pivot_d+2*clearance); }

// ---------- head (face plate on the bed; Y down from the head top) ----------
module hcsr04_eyes(clearance=0.25) {
  for(x=otto_eyes) translate([x,otto_eye_y,-1]) cylinder(d=otto_eye_d+2*clearance,h=otto_wall+2,$fn=48);
  for(x=otto_eyes) translate([x,otto_eye_y,otto_wall-0.01]) cylinder(d=otto_transducer[0]+2*clearance,h=otto_sensor_pos[2]-otto_wall+0.02,$fn=48);
  translate([otto_sensor_pos[0],otto_sensor_pos[1],otto_sensor_pos[2]]) fit_box(otto_sensor,clearance);
}
// Nano I/O shield stands upright on back-cover standoffs, Nano facing the face, its
// Type-C port pointing UP at the board's top edge. Head-local z of the PCB back:
function shield_back_z() = otto_head[2]-otto_wall-otto_shield_standoff;
function usb_z() = shield_back_z()-otto_shield[2]-otto_nano_usb[1];
// Type-C cable opening through the head top, above the port. Its rear side is a
// 45-degree gable so the opening prints without support (head prints face down).
module usbc_top_slot(clearance=0.25) {
  hw=otto_usb[0]/2+clearance; hh=otto_usb[1]/2+clearance; zc=usb_z();
  translate([otto_nano_usb[0],0,0]) rotate([90,0,0]) translate([0,0,-100]) linear_extrude(100+otto_wall+1)
    polygon([[-hw,zc-hh],[hw,zc-hh],[hw,zc+hh],[0,zc+hh+hw],[-hw,zc+hh]]);
}
// Face mounts, added after the cavity cuts. HC-SR04: posts from the face plate to the
// board, pins through its corner holes (secure with a melted tip or a drop of glue).
// Edge guide along +x of a board edge at x = edge (mirrored for -x): a wall from the face plate,
// with a 45-degree snap ridge just behind the PCB. Board edges, not screw holes, locate it.
module edge_guide(edge, y0, y1, pcb_back, clearance) {
  g=otto_guide; x0=edge+clearance; zr=pcb_back+clearance; d=clearance+g[2]; rise=1.2*(d+0.01);   // steeper than 45 degrees
  for(m=[0,1]) mirror([m,0,0]) {
    translate([x0,y0,otto_wall-0.01]) cube([g[0],y1-y0,zr+2*rise+0.5-otto_wall+0.01]);
    translate([0,(y0+y1)/2,0]) rotate([90,0,0]) linear_extrude(y1-y0,center=true)
      polygon([[x0+0.01,zr],[x0-d,zr+rise],[x0+0.01,zr+2*rise]]);
  }
}
// HC-SR04: the transducers in the eye holes locate it; four corner pads hold the PCB 5 mm
// behind the face and side guides snap over its back.
module hcsr04_mount(clearance=0.25) {
  z=otto_sensor_pos[2]; ys=otto_sensor_pos[1];
  for(sx=[-1,1], sy=[-1,1]) translate([sx*(otto_sensor[0]/2-1.5),ys+sy*(otto_sensor[1]/2-1.5),otto_wall-0.01]) fit_box([3,3,z-otto_wall+0.01]);
  edge_guide(otto_sensor[0]/2,ys-otto_guide[1]/2,ys+otto_guide[1]/2,z+otto_pcb,clearance);
}
// OLED (upside down): its glass rests on the face plate; side guides snap over the PCB and two
// stops under its bottom corners (clear of the header) carry it. The eye cans sit 1 mm above
// its top edge, so it can't slide up.
function oled_pcb_y() = otto_oled_pos[1]+otto_oled_offset;
module oled_mount(clearance=0.25) {
  w=otto_oled[0]/2; h=otto_oled[1]/2; y=oled_pcb_y(); back=otto_wall+otto_oled_glass+otto_pcb; g=otto_guide;
  edge_guide(w,y-g[1]/2,y+g[1]/2,back,clearance);
  for(sx=[-1,1]) translate([sx*(w-2.5),y-h-clearance-g[0]/2,otto_wall-0.01]) fit_box([5,g[0],back-otto_wall+1]);
}
// Visible-area window only: the glass rests flat on the inside of the face plate.
module oled_window(clearance=0.25) {
  translate([otto_oled_pos[0],otto_oled_pos[1],-1]) fit_box([otto_oled_visible[0],otto_oled_visible[1],otto_wall+2],clearance);
}

// ---------- back cover (outside face on the bed) ----------
// Two posts carry the shield's top mounting holes (M3 self-tapping screws). The
// bottom holes sit below the body rim, where no post can reach; the body's rear
// wall backs the lower board edge instead.
function shield_hole_y() = otto_shield_top-(otto_shield[1]-otto_shield_holes[1])/2;
module shield_standoffs() {
  for(s=[-1,1]) translate([s*otto_shield_holes[0]/2,shield_hole_y(),otto_wall-0.01]) cylinder(d=otto_standoff[0],h=otto_shield_standoff+0.01,$fn=32);
}
module shield_pilots() {
  for(s=[-1,1]) translate([s*otto_shield_holes[0]/2,shield_hole_y(),otto_wall+0.5]) cylinder(d=otto_standoff[1],h=100,$fn=24);
}

// ---------- body (floor on the bed) ----------
// Hip servos stand shaft-down on the floor; posts carry the mounting ears and the
// output shaft passes through the floor to the leg below.
function hip_case_y() = otto_hip_y+otto_servo_shaft;
module hip_posts() {
  for(x=otto_hip_x, dy=[-14,14]) translate([x,hip_case_y()+dy,otto_wall-0.01]) cylinder(d=4.5,h=otto_servo_ear_z+0.01,$fn=24);   // clears the 12 mm shaft hole
}
// Buzzer stands sound-side down in a floor ring; it sounds through a floor hole.
module buzzer_ring(clearance=0.25) {
  translate([otto_buzzer_pos[0],otto_buzzer_pos[1],0]) cylinder(d=otto_buzzer[0]+2*clearance+3,h=otto_wall+otto_buzzer[1]*0.6,$fn=48);
}
// Crush ribs inside the ring grip the buzzer; added after the seat is cut.
module buzzer_ribs(clearance=0.25) {
  for(a=[0,90,180,270]) translate([otto_buzzer_pos[0],otto_buzzer_pos[1],otto_wall-0.01]) rotate(a)
    translate([otto_buzzer[0]/2-otto_buzzer_rib,-0.5,0]) cube([otto_buzzer_rib+clearance+0.5,1,otto_buzzer[1]*0.6+0.01]);
}
module buzzer_seat(clearance=0.25) {
  translate([otto_buzzer_pos[0],otto_buzzer_pos[1],otto_wall]) cylinder(d=otto_buzzer[0]+2*clearance,h=100,$fn=48);
  translate([otto_buzzer_pos[0],otto_buzzer_pos[1],-1]) cylinder(d=5,h=otto_wall+2,$fn=24);
}
// The hip servo cases guide the battery holder sideways and the front wall stops it;
// two rear posts stop it at the back and leave the middle free for its leads.
module battery_stops(clearance=0.25) {
  y=otto_battery_pos[1]+otto_battery[0]/2+clearance;
  for(s=[-1,1]) translate([s*10,y+otto_battery_stop[1]/2,otto_wall-0.01]) fit_box([otto_battery_stop[0],otto_battery_stop[1],otto_battery_stop[2]+0.01]);
}
module body_cavities(clearance=0.25) {
  for(x=otto_hip_x) {
    translate([x,otto_hip_y,-1]) cylinder(d=12+2*clearance,h=otto_wall+2,$fn=40);
    for(dy=[-14,14]) translate([x,hip_case_y()+dy,otto_wall]) cylinder(d=1.8,h=20,$fn=16);
  }
  translate([otto_switch_pos[0],otto_switch_pos[1],-1]) fit_box([otto_switch[0],otto_switch[1],otto_wall+2],clearance);
}

// ---------- leg (prints top-down: z=0 is the leg top) ----------
// Ankle servo sits upright inside, shaft facing forward (-Y); it slides in from
// the open bottom, its boss through a U-slot. A pin through the rear wall is the pivot.
module leg_cavities(clearance=0.25) {
  h=otto_leg[2]; axis=h-otto_ankle_z; centre=h-otto_ankle_z-otto_servo_shaft; top=centre-otto_servo_ears/2;
  translate([0,0,top]) fit_box([otto_servo[1],otto_servo_body,h],clearance);
  translate([0,-otto_servo_body/2,0]) rotate([90,0,0]) linear_extrude(10) hull() {
    translate([0,axis]) circle(d=12+2*clearance,$fn=40);
    translate([0,h+10]) square(12+2*clearance,center=true);
  }
  translate([0,0,axis]) pivot_hole(clearance);
  horn_recess_bed(clearance);
}
// Ankle servo retention: a seat in front of the top ear takes the servo's ear screw
// (pilot along Y); a hole through the rear wall gives the screwdriver access.
function ankle_case_centre() = otto_leg[2]-otto_ankle_z-otto_servo_shaft;
module ankle_ear_seat(clearance=0.25) {
  y0=-otto_servo_body/2-clearance; y1=-otto_servo_body/2+otto_servo_ear_z-clearance;
  z0=ankle_case_centre()-otto_servo_ears/2-clearance; z1=ankle_case_centre()-otto_servo[0]/2-clearance;
  translate([-otto_servo[1]/2-clearance-0.01,y0-0.01,z0-0.01]) cube([otto_servo[1]+2*clearance+0.02,y1-y0+0.01,z1-z0+0.01]);
}
module ankle_ear_screw(clearance=0.25) {
  z=ankle_case_centre()-otto_servo_ear_hole;
  translate([0,-otto_servo_body/2+otto_servo_ear_z-clearance+0.01,z]) rotate([90,0,0]) linear_extrude(5.5) teardrop2d(1.8);
  translate([0,otto_leg[1],z]) rotate([90,0,0]) linear_extrude(otto_leg[1]-otto_servo_body/2) teardrop2d(4);
}

// ---------- foot (sole on the bed; x=0, y=0 is the leg centre) ----------
function ankle_axis_z() = otto_sole+otto_leg_gap+otto_ankle_z;
function bracket_y() = otto_leg[1]/2+otto_leg_gap;
module foot_brackets() {
  for(s=[-1,1]) translate([0,s*(bracket_y()+otto_bracket[1]/2),0]) fit_box([otto_bracket[0],otto_bracket[1],otto_foot[2]]);
}
module foot_cavities(clearance=0.25) {
  translate([0,-bracket_y()+0.01,ankle_axis_z()]) horn_recess_wall(clearance);
  translate([0,bracket_y(),ankle_axis_z()]) pivot_hole(clearance);
}

// Four independent small fit-test prints, all using the production cutters.
module otto_coupon(kind=0, clearance=0.25) {
  if(kind==0) difference() { fit_box([38,18,31]); translate([0,0,3]) servo_pocket(clearance); }
  if(kind==1) {   // face strip: both eye holes, the OLED window and both edge mounts
    difference() {
      translate([-otto_sensor[0]/2-4,otto_sensor_pos[1]+otto_sensor[1]/2+3,0]) mirror([0,1,0]) cube([otto_sensor[0]+8,60,otto_wall]);
      hcsr04_eyes(clearance); oled_window(clearance);
    }
    hcsr04_mount(clearance); oled_mount(clearance);
  }
  if(kind==2) difference() {
    fit_box([20,14,3]);
    translate([0,0,-1]) fit_box([otto_usb[0],otto_usb[1],5],clearance);
  }
  if(kind==3) difference() {   // battery holder tray: footprint and the hip-servo gap width
    fit_box([otto_battery[0]+6,otto_battery[1]+6,8]);
    translate([0,0,3]) fit_box([otto_battery[0],otto_battery[1],10],clearance);
  }
}
