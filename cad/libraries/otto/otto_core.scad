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
// Hip horn pocket INSIDE the leg, as on Otto V13: the horn lies on the closed end's plate, arm toward the rear,
// hub up through the plate to the servo's spline; its screw is driven from the leg's open end before the ankle
// servo goes in. The plate is then held between the servo's boss (above) and the horn's arm (below), so the leg
// cannot drop off. The arm pocket runs out through the rear wall: an uncut 21.3 mm horn is 0.4 longer than the leg.
module horn_pocket_leg(clearance=0.25) {
  translate([0,0,-1]) cylinder(d=otto_horn_hub+2*clearance,h=otto_leg_top+2,$fn=40);
  translate([0,0,otto_leg_plate]) linear_extrude(otto_leg_top-otto_leg_plate+1) { circle(d=otto_horn_hub+2*clearance,$fn=40); horn_arm2d(clearance); }
}
// Ankle horn keyhole in the front bracket, cut along -Y from y=0 (the bracket's inner face),
// origin on the ankle axis. The channel is open to the bracket top: the leg drops in with the
// horn already on the servo, hub down the channel, arm into the pocket below. The horn screw
// goes in from outside through a head-sized hole; the head sitting in that hole also keeps
// the foot from sliding off downward. The arm pocket takes the horn UNCUT and ends 1.1 mm above the ground.
function ankle_pocket() = otto_bracket[1]-otto_horn_web;
module horn_recess_wall(clearance=0.25) {
  r=otto_horn_hub/2+clearance;
  rotate([90,0,0]) {
    translate([0,0,-0.01]) linear_extrude(ankle_pocket()+0.01) {
      circle(r=r,$fn=40);
      translate([-r,0]) square([2*r,100]);
      mirror([0,1]) horn_arm2d(clearance);
    }
    linear_extrude(100) teardrop2d(otto_horn_head+2*clearance);
  }
}

// ---------- head (face plate on the bed; Y down from the head top) ----------
module hcsr04_eyes(clearance=0.25) {
  for(x=otto_eyes) translate([x,otto_eye_y,-1]) cylinder(d=otto_eye_d+2*clearance,h=otto_wall+2,$fn=48);
  for(x=otto_eyes) translate([x,otto_eye_y,otto_wall-0.01]) cylinder(d=otto_eye_d+2*clearance,h=otto_sensor_pos[2]-otto_wall+0.02,$fn=48);
  translate([otto_sensor_pos[0],otto_sensor_pos[1],otto_sensor_pos[2]]) fit_box(otto_sensor,clearance);
}
// Nano I/O shield stands upright on back-cover clips, Nano facing the face, its
// Type-C port pointing UP at the board's top edge. Head-local z of the PCB back:
function shield_back_z() = otto_head[2]-otto_wall-otto_shield_standoff;
function usb_z() = shield_back_z()-otto_shield[2]-otto_nano_usb[1];
// Type-C cable opening through the head top, above the port. Its rear side is a
// 45-degree gable so the opening prints without support (head prints face down).
module usbc_top_slot(clearance=0.25) {
  hw=otto_usb_slot[0]/2+clearance; hh=otto_usb_slot[1]/2+clearance; zc=usb_z();
  translate([otto_nano_usb[0],0,0]) rotate([90,0,0]) translate([0,0,-100]) linear_extrude(100+otto_wall+1)
    polygon([[-hw,zc-hh],[hw,zc-hh],[hw,zc+hh],[0,zc+hh+hw],[-hw,zc+hh]]);
}
// Face mounts, added after the cavity cuts. HC-SR04: posts from the face plate to the
// board, pins through its corner holes (secure with a melted tip or a drop of glue).
// Edge guide along +x of a board edge at x = edge (mirrored for -x): a wall from the face plate,
// with a 45-degree snap ridge just behind the PCB. Board edges, not screw holes, locate it.
module edge_guide(edge, y0, y1, pcb_back, clearance, overlap=otto_guide[2], gap=[0,0]) {
  g=otto_guide; x0=edge+clearance; zr=pcb_back+clearance; d=clearance+overlap; rise=1.2*(d+0.01);   // steeper than 45 degrees
  for(m=[0,1]) mirror([m,0,0]) {
    translate([x0,y0,otto_wall-0.01]) cube([g[0],y1-y0,zr+2*rise+0.5-otto_wall+0.01]);
    // The snap ridge may be left out over a span (where a cover screw post stands).
    for(s=gap[1]>gap[0]?[[y0,gap[0]],[gap[1],y1]]:[[y0,y1]]) translate([0,s[1],0]) rotate([90,0,0]) linear_extrude(s[1]-s[0])
      polygon([[x0+0.01,zr],[x0-d,zr+rise],[x0+0.01,zr+2*rise]]);
  }
}
// HC-SR04, held like official Otto: its eyes press snugly into the eye holes. Four corner pads
// stop it 5 mm behind the face; two short solid side guides (no snap: tall thin snap arms broke
// on a test print) keep it square. A dot of hot glue on a guide makes it permanent.
module hcsr04_mount(clearance=0.25) {
  z=otto_sensor_pos[2]; ys=otto_sensor_pos[1]; x0=otto_sensor[0]/2+clearance;
  for(sx=[-1,1], sy=[-1,1]) translate([sx*(otto_sensor[0]/2-1.5),ys+sy*(otto_sensor[1]/2-1.5),otto_wall-0.01]) fit_box([3,3,z-otto_wall+0.01]);
  for(m=[0,1]) mirror([m,0,0]) translate([x0,ys-otto_guide[1]/2,otto_wall-0.01]) cube([2,otto_guide[1],z+otto_pcb-otto_wall+0.01]);
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
// The shield snaps between two side guides on the back cover and rests on two edge ledges;
// two stepped pegs through its top mounting holes set its height (fat base under the PCB,
// thin pointed pin through the hole). Its lower edge hangs 6 mm above the battery holder.
module shield_mount(clearance=0.25) {
  w=otto_shield[0]/2; yt=otto_shield_top; yb=-head_h_cover();
  y0=max(yb+1,yt-otto_shield[1]+2);
  y1=min(yt-2,otto_shield_rail_top);
  edge_guide(w,y0,y1,otto_wall+otto_shield_standoff+otto_shield[2],clearance,otto_shield_snap,
    [otto_cover_screw[0]-otto_cover_post[0]/2-1,otto_cover_screw[0]+otto_cover_post[0]/2+1]);
  shield_ledges(y0,y1,clearance);
  shield_pegs();
}
module shield_pegs() {
  for(h=otto_shield_holes) translate([h[0],otto_shield_top-h[1],otto_wall-0.01]) {
    cylinder(d=otto_shield_peg[0],h=otto_shield_standoff+0.01,$fn=32);
    cylinder(d=otto_shield_peg[1],h=otto_shield_standoff+otto_shield[2]+0.8,$fn=24);
    translate([0,0,otto_shield_standoff+otto_shield[2]+0.8-0.01]) cylinder(d1=otto_shield_peg[1],d2=1.2,h=0.8,$fn=24);
  }
}
// The PCB's bare side edges rest on these, so its solder tails stay clear of the cover;
// the snap ridges hold it from the front.
module shield_ledges(y0, y1, clearance=0.25) {
  w=otto_shield[0]/2;
  for(m=[0,1]) mirror([m,0,0]) translate([w-otto_shield_ledge,y0,otto_wall-0.01]) cube([otto_shield_ledge+clearance+0.01,y1-y0,otto_shield_standoff+0.01]);
}
// Crush ribs on the back-cover lip: they press otto_cover_crush into the head's side walls
// whatever the clearance, so the cover pushes in snugly and stays put. Lead-in at the tip.
module cover_ribs(clearance=0.25) {
  xw=otto_head[0]/2-otto_wall; l=otto_cover_lip;
  for(m=[0,1], y=otto_cover_ribs) mirror([m,0,0]) hull() {
    translate([xw-clearance-0.5,y-0.6,otto_wall-0.01]) cube([0.5+clearance+otto_cover_crush,1.2,l-1+0.01]);
    translate([xw-clearance-0.5,y-0.6,otto_wall]) cube([0.5,1.2,l]);
  }
}
function head_h_cover() = otto_head[1]-otto_head_insert;   // the cover stops at the body rim

// ---------- body (floor on the bed) ----------
// Hip servos stand shaft-down on the floor; posts carry the mounting ears and the
// output shaft passes through the floor to the leg below.
function hip_case_y() = otto_hip_y+otto_servo_shaft;
module hip_posts() {
  for(x=otto_hip_x, dy=[-otto_servo_ear_hole,otto_servo_ear_hole]) translate([x,hip_case_y()+dy,otto_wall-0.01]) cylinder(d=4.5,h=otto_hip_post+0.01,$fn=24);   // clears the 12 mm shaft hole
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
module body_cavities(clearance=0.25,clip=true) {
  for(x=otto_hip_x) {
    // Boss hole, stretched toward the case centre: the gear housing beside the shaft is raised too.
    // Cut the full post height: at clearance 0.5 the hole grazes the front post, and a cut that stopped
    // just above the floor left an overhang on it.
    hull() for(dy=[0,otto_servo_shaft]) translate([x,otto_hip_y+dy,-1]) cylinder(d=otto_servo_boss+0.2+2*clearance,h=otto_wall+otto_hip_post+2,$fn=40);
    // Ear screw pilots run through the post AND the floor, so a stock 8 mm screw never bottoms out.
    for(dy=[-otto_servo_ear_hole,otto_servo_ear_hole]) translate([x,hip_case_y()+dy,-1]) cylinder(d=1.8,h=otto_wall+otto_hip_post+2,$fn=16);
    // Room for the servo case between the two ear posts: the measured 23.16 case left only 0.17 per end,
    // and the posts did not follow the clearance setting.
    translate([x,hip_case_y(),otto_wall+clearance]) fit_box([otto_servo[1],otto_servo[0],otto_hip_post+1],clearance);
    // Ankle servo lead comes up through the floor behind the hip servo, outside the leg's swing.
    translate([x,otto_wire_y,-1]) fit_box([otto_wire[1],otto_wire[0],otto_wall+2],clearance);
  }
  translate([otto_switch_pos[0],otto_switch_pos[1],-1]) fit_box([otto_switch[0],otto_switch[1],otto_wall+2],clearance);
  // Floor window in front of each hip servo, over the opening in the leg top: the ankle servo's cable comes up
  // through it (V13: 7 deep, 10 to 17 in front of the hip axis). It stops short of the front ear post.
  f=otto_floor_cable;
  for(x=otto_hip_x) translate([x<0?x-f[3]:x-f[2],otto_hip_y+f[0],-1]) cube([f[2]+f[3],f[1]-f[0],otto_wall+2]);
  // Grooves the head's clip barbs click into (as on V13: 1.6 deep, 4 tall at the mouth, centre 5 below the rim
  // there; ours sits 6 below because the head's band goes 3 in). Upper flank 46 degrees, so no support.
  if(clip) clip_groove();
}
// Head-to-body clip, as on Otto V13 (measured on the builder's parts): each head side wall continues below the
// insert band as a tab with a barb on its outside; the barb clicks into a groove inside the body's side wall,
// behind which the wall carries a bump on the outside so it stays 1.6 thick. Overlap 1.3 per side (the first
// version was a 0.45 ridge on the band, 1.5 below the rim, under a 0.78 lip). Both flanks slope, so the head
// pulls off by hand. With the head printing face-down the tab and barb are upright prisms with ramped lower ends.
function clip_out() = (otto_body_inner[0]-otto_head[0])/2+otto_latch;   // barb crest out of the head wall
function clip_drop() = otto_head_insert+otto_clip_tab[1]-otto_clip_barb[0]/2;   // crest centre below the body rim
module head_snap() {
  x0=otto_head[0]/2; yb=-otto_head[1]; t=otto_clip_tab; b=otto_clip_barb; o=clip_out(); z0=otto_snap_z[0]; z1=otto_snap_z[1];
  yc=yb-t[1]+b[0]/2;
  for(m=[0,1]) mirror([m,0,0]) {
    hull() {
      translate([0,0,z0]) linear_extrude(z1-z0) polygon([[x0-otto_wall,yb+0.01],[x0,yb+0.01],[x0,yb-t[1]],[x0-otto_wall,yb-t[1]]]);
      translate([0,0,z0-t[1]*1.04]) linear_extrude(0.01) polygon([[x0-otto_wall,yb+0.01],[x0,yb+0.01],[x0,yb],[x0-otto_wall,yb]]);
    }
    hull() {
      translate([0,0,z0+o*1.04]) linear_extrude(z1-z0-o*1.04) polygon([[x0-0.01,yc+b[0]/2],[x0+o,yc+b[1]/2],[x0+o,yc-b[1]/2],[x0-0.01,yc-b[0]/2]]);
      translate([0,0,z0]) linear_extrude(0.01) polygon([[x0-0.01,yc+b[0]/2],[x0,yc+b[1]/2],[x0,yc-b[1]/2],[x0-0.01,yc-b[0]/2]]);
    }
  }
}
function clip_y() = [-otto_head_band/2+otto_snap_z[0]-1,-otto_head_band/2+otto_snap_z[1]+1];
module clip_groove() {
  xi=otto_body_inner[0]/2; zc=otto_body[2]-clip_drop(); d=otto_latch+otto_clip_air; hm=otto_clip_barb[0]/2+0.2; hb=hm-d*1.045; y=clip_y();
  for(m=[0,1]) mirror([m,0,0]) translate([0,y[1],zc]) rotate([90,0,0]) linear_extrude(y[1]-y[0]) polygon([[xi-0.01,-hm],[xi+d,-hb],[xi+d,hb-0.2],[xi-0.01,hm-0.2]]);   // no extra room above the barb: the head may lift only 0.25
}
module clip_bumps(out=0) {
  xo=otto_body[0]/2+out; zc=otto_body[2]-clip_drop(); p=otto_clip_bump; hm=otto_clip_barb[0]/2+0.2; y=clip_y();
  for(m=[0,1]) mirror([m,0,0]) translate([0,y[1]+p,zc]) rotate([90,0,0]) linear_extrude(y[1]-y[0]+2*p) polygon([[xo-0.01,-hm-p*1.045],[xo+p,-hm],[xo+p,hm],[xo-0.01,hm+p*1.045]]);
}
// Seats in the body's two front corners, level with the bottom of the head's band: the front of the head
// stands on them (the rear already rests on the body's rear rim). V13 has such gussets in all four corners.
module head_seats() {
  l=otto_head_seat; x=otto_body_inner[0]/2+0.01; z=otto_body[2]-otto_head_insert;
  for(s=[-1,1]) hull() {
    translate([s*x,-x,z-0.01]) linear_extrude(0.01) polygon([[0,0],[-s*l,0],[0,l]]);
    translate([s*x,-x,z-l*1.045]) linear_extrude(0.01) polygon([[s*0.05,-0.05],[s*0.02,-0.05],[s*0.05,-0.02]]);   // tip inside the wall
  }
}

// ---------- leg (prints top-down: z=0 is the leg top) ----------
// Otto V13 layout. The ankle servo stands in a bay that is 6 mm deeper than the servo, shaft facing forward
// (-Y); it slides in from the open bottom with its boss in a U-slot through the front wall. The case's far end
// rests on a block in the front of the bay and the far ear lies against that block's rear face, where one
// servo screw pins it: that screw alone sets how far forward the servo sits, so the bay's depth and the
// unmeasured height of the ear on the case do not have to match anything.
function leg_bay_x(clearance) = otto_leg_bay/2-0.25+clearance;
function leg_bay_y() = otto_leg[1]/2-otto_wall;
function ankle_case_centre() = otto_leg[2]-otto_ankle_z-otto_servo_shaft;
function ankle_seat_y() = -otto_leg[1]/2+otto_ankle_seat;
module leg_cavities(clearance=0.25) {
  h=otto_leg[2]; axis=h-otto_ankle_z; x=leg_bay_x(clearance); y=leg_bay_y();
  translate([-x,-y,otto_leg_top]) cube([2*x,2*y,h]);
  translate([0,-y+0.01,0]) rotate([90,0,0]) linear_extrude(10) hull() {
    translate([0,axis]) circle(d=otto_servo_boss+0.2+2*clearance,$fn=40);
    translate([0,axis-otto_servo_shaft+0.5]) circle(d=10+2*clearance,$fn=40);   // the raised gear housing beside the shaft
    translate([0,h+10]) square(otto_servo_boss+0.2+2*clearance,center=true);
  }
  horn_pocket_leg(clearance);
  // (The rear window is cut at the end of this module.) The cable leaves the case bottom at the SHAFT end
  // (builder's photo, Nov 11) and runs up the back of the servo, in the 3.5 mm the bay leaves behind it (as on
  // V13), then over the servo's top and out through leg_cable_way() in the leg top.
  // Finger windows through both side walls under the plate, as on V13 (23.7 long there): a finger and thumb
  // reach the horn to hold it on the hip servo's shaft while its screw goes in. Gabled, so no bridge.
  wy=[ankle_seat_y()+0.5,leg_bay_y()-1];
  translate([-otto_leg[0],0,0]) rotate([90,0,90]) linear_extrude(2*otto_leg[0])
    polygon([[wy[0],otto_leg_top],[wy[1],otto_leg_top],[wy[1],otto_leg_window],[(wy[0]+wy[1])/2,otto_leg_window+(wy[1]-wy[0])/2*1.04],[wy[0],otto_leg_window]]);
  // Rear window at the leg top: the screwdriver for the ear screw goes in through it, the horn's arm pocket
  // opens into it (it starts at the plate), and a plug still passes (the older cable route, to the floor slot
  // behind the hip servo). 45-degree gable on the print-up side.
  hw=otto_wire[1]/2+clearance; z1=ankle_case_centre()-otto_servo_ear_hole+2;
  translate([0,otto_leg[1]/2+1,0]) rotate([90,0,0]) linear_extrude(otto_wall+1.5)
    polygon([[-hw,otto_leg_plate],[hw,otto_leg_plate],[hw,z1],[0,z1+hw*1.1],[-hw,z1]]);
}
// Block in the front of the bay: its top carries the case's far end, its rear face is the ear seat.
module ankle_ear_block(clearance=0.25) {
  x=leg_bay_x(clearance)+0.01; y0=-leg_bay_y()-0.01; axis=otto_leg[2]-otto_ankle_z; z1=axis-otto_ankle_ledge;
  translate([-x,y0,otto_leg_top-0.01]) cube([2*x,ankle_seat_y()-y0,z1-otto_leg_top+0.01]);
  // Step that doubles the front wall between the block and the U-slot (the servo's flat top stays 1.3 behind it).
  translate([-x,y0,z1-0.01]) cube([2*x,otto_ankle_pad[0]+0.01,axis-otto_ankle_pad[1]-z1+0.01]);
}
// Slot in the block that the ear screw cuts its own thread in, driven from the rear through the window. It is
// open to the block's top, so it prints without a bridge and still catches a screw whose hole sits nearer the
// case than the drawing says.
module ankle_ear_screw(clearance=0.25) {
  z=ankle_case_centre()-otto_servo_ear_hole-otto_ear_pilot[1]/2;
  translate([-otto_ear_pilot[0]/2,ankle_seat_y()+0.01-otto_ear_pilot[2],z]) cube([otto_ear_pilot[0],otto_ear_pilot[2],otto_leg[2]]);
}

// Rear ankle pivot: a printed knob on the leg's rear wall, on the ankle axis (V13 has a hemisphere there). It
// turns in a round dimple in the foot's rear bracket. No screw goes in from the rear, because the servo cable
// runs up the inside of that wall. The knob is a short round pin, so the play in the dimple does not depend on
// how far forward the leg sits (a cone got looser as the leg slid forward: review, Nov 12). The side that faces
// the bed when the leg prints (the upper side on the robot, which carries no weight) is cut away at 45 degrees
// from the wall outward, so the pin prints without support.
module ankle_knob() {
  k=otto_knob; a=otto_leg[2]-otto_ankle_z; y0=otto_leg[1]/2; c=0.7*k[0]/2;
  intersection() {
    translate([0,y0-0.01,a]) rotate([-90,0,0]) {
      cylinder(d=k[0],h=k[1]-k[2]+0.02,$fn=48);
      translate([0,0,k[1]-k[2]+0.01]) cylinder(d1=k[0],d2=k[0]-2*k[2],h=k[2],$fn=48);
    }
    translate([-k[0],0,0]) rotate([90,0,90]) linear_extrude(2*k[0])
      polygon([[y0-0.02,a-c],[y0+k[1]+1,a-c+1.05*(k[1]+1.02)],[y0+k[1]+1,a+k[0]],[y0-0.02,a+k[0]]]);
  }
}
// Slot for the extra screw that fixes the horn's arm to the leg's top plate (V13 has a hole 11 from the hub
// centre). A slot, because where the holes sit along the builder's arm is unmeasured. The screw goes in from
// the leg top before the leg is fitted; its head sinks into the V so it stays under the body floor.
module leg_arm_slot() {
  m=otto_arm_slot; hw=m[0]/2; t=otto_leg_plate;
  // Two convex pieces, each hulled on its own (one hull over the whole section fills the V in: review, Nov 12).
  hull() for(y=[m[1],m[2]]) translate([0,y,-0.01]) cylinder(r=hw,h=otto_leg_top+0.5,$fn=32);
  hull() for(y=[m[1],m[2]]) translate([0,y,0]) {   // head recess and its seat: convex together
    translate([0,0,-0.01]) cylinder(r=m[3]/2,h=m[4]+0.01,$fn=32);
    translate([0,0,m[4]]) cylinder(r1=m[3]/2,r2=hw,h=t-m[4]+0.01,$fn=32);   // seat ends at the slot's own width
  }
}
// Way out of the leg top for the ankle servo's cable, as on V13: an opening through the top plate in front of
// the ear seat, and the space behind it hollowed out under a 46-degree roof, so the block that carries the servo
// becomes a shelf on a brace. The cable comes over the top of the servo, into this space from the bay, and up
// through the body floor in front of the hip servo.
module leg_cable_way() {
  w=otto_leg_cable[0]; yf=-leg_bay_y(); ys=ankle_seat_y()+0.01; zf=otto_leg_cable[1];
  translate([-w/2,0,0]) rotate([90,0,90]) linear_extrude(w) polygon([[yf,-1],[ys,-1],[ys,zf+(ys-yf)*1.04],[yf,zf]]);
  // The layer between the plate and the bay is cut back behind the opening, as on V13 (plate 2.5 thick at that
  // edge): without it a 14 mm plug had 0.1 mm to spare on its way round the corner; with it 4.0 passes (review).
  translate([-w/2,ys-0.1,otto_leg_plate]) cube([w,otto_leg_cable[2]+0.1,otto_leg_top-otto_leg_plate+0.01]);
}

// ---------- foot (sole on the bed; x=0, y=0 is the leg centre) ----------
function ankle_axis_z() = otto_sole+otto_ankle_gap+otto_ankle_z;
// Inner faces of the two brackets. The front gap is wider: the servo boss sticks out there.
function bracket_front_y() = otto_leg[1]/2+otto_ankle_front_gap;
function bracket_rear_y() = otto_leg[1]/2+otto_ankle_rear_gap;
module foot_brackets() {
  translate([0,-bracket_front_y()-otto_bracket[1]/2,0]) fit_box([otto_bracket[0],otto_bracket[1],otto_foot[2]]);
  translate([0,bracket_rear_y()+otto_bracket[2]/2,0]) fit_box([otto_bracket[0],otto_bracket[2],otto_foot[2]]);
}
module foot_cavities(clearance=0.25) {
  translate([0,-bracket_front_y()+0.01,ankle_axis_z()]) horn_recess_wall(clearance);
  // Slot for the extra screw into the horn's arm (V13: a hole 10.5 below the axis), through the web. It is a pilot
  // (1.8 wide): the screw cuts its thread in the web and only reaches into the arm's hole like a pin, so tightening
  // it does not pull the bracket against the leg (the arm lies 0.7 behind the web). SHORT screw, 5.5 mm of
  // thread or less: past 6.1 its tip comes out of the bracket and meets the edge of the leg's U-slot as the ankle rolls.
  m=otto_arm_slot;
  hull() for(d=[m[1],m[2]]) translate([0,-bracket_front_y(),ankle_axis_z()-d]) rotate([90,0,0]) linear_extrude(40) teardrop2d(otto_ear_pilot[0]);
  // Round dimple for the leg's knob (teardrop roof, so it prints), and a ramp down the bracket's inner face that
  // leads the knob to it: the leg is pushed straight down and the knob clicks in past the ramp's shallow end.
  k=otto_knob; g=otto_ankle_rear_gap; d=k[1]-g+otto_knob_fit[1];
  y=bracket_rear_y(); z=ankle_axis_z(); r=otto_knob_ramp;
  translate([0,y+d,z]) rotate([90,0,0]) linear_extrude(d+0.01) teardrop2d(k[0]+2*otto_knob_fit[0]);
  translate([-r[0]/2,0,0]) rotate([90,0,90]) linear_extrude(r[0])
    polygon([[y-0.01,otto_foot[2]+0.01],[y+r[1],otto_foot[2]+0.01],[y+r[2],z],[y-0.01,z]]);
}
// ---------- back-cover cross screws ----------
// One servo ear screw through each head side wall into a post on the cover: the cover cannot slide out
// without shearing a steel screw, however much the walls flex. The posts stand outside the shield's side
// edges (on the rail and the gap to the wall), so the screw passes in FRONT of the PCB's bare edge strip.
// Head-local z of the screw axis:
function cover_screw_z() = otto_head[2]-otto_cover_screw[1];
// Posts: vertical prisms from the cover plate (print-up), from the shield rail's inner face to the lip's
// outer face, with a lead-in chamfer on the outer top edge.
function cover_post_x(clearance) = [otto_shield[0]/2+clearance,otto_head[0]/2-otto_wall-clearance];
module cover_posts(clearance=0.25) {
  x=cover_post_x(clearance); l=otto_cover_post[0]; h=otto_cover_post[1]; ch=otto_cover_post[2];
  for(m=[0,1]) mirror([m,0,0]) translate([0,otto_cover_screw[0]+l/2,0]) rotate([90,0,0]) linear_extrude(l)
    polygon([[x[0],otto_wall-0.01],[x[1],otto_wall-0.01],[x[1],h-ch],[x[1]-ch,h],[x[0],h]]);
}
// Pilot along x through each post (and the rail it stands on): a teardrop with its point toward print-up.
module cover_post_pilots(clearance=0.25) {
  x=cover_post_x(clearance);
  for(m=[0,1]) mirror([m,0,0]) translate([x[0]-1,otto_cover_screw[0],otto_cover_screw[1]]) rotate([0,90,0])
    linear_extrude(x[1]-x[0]+2) rotate(90) teardrop2d(otto_pin[0]);
}
// Matching pilot through each head side wall (point toward the rear edge = print-up), and a well for the
// screw head that only cuts into shells grown thicker than the standard wall.
module cover_screw_holes() {
  xw=otto_head[0]/2;
  for(m=[0,1]) mirror([m,0,0]) translate([0,otto_cover_screw[0],cover_screw_z()]) rotate([0,90,0]) {
    translate([0,0,xw-otto_wall-1]) linear_extrude(otto_wall+1.02) rotate(90) teardrop2d(otto_pin[0]);
    translate([0,0,xw+0.01]) linear_extrude(100) rotate(90) teardrop2d(otto_screw_head);
  }
}
// Drill guide for a head printed before the cover screws existed: lies flat on the outside of a side wall,
// hook over the cover's outside face, tooth in the notch on the cover's edge; the hole marks the pilot.
module cover_jig() {
  j=otto_cover_jig; t=j[2]; k=otto_cover_mark[1];
  difference() {
    union() {
      translate([-otto_wall,-j[0]/2,0]) cube([j[1],j[0],t]);            // plate against the side wall
      translate([-otto_wall,-j[0]/2,0]) cube([otto_wall,j[0],t+3]);     // hook over the cover's outside face
      translate([0,0,t-0.01]) rotate([90,0,90]) linear_extrude(otto_wall-0.2) polygon([[-k,0],[k,0],[0,k]]);   // tooth for the notch
    }
    translate([otto_cover_screw[1],0,-1]) cylinder(d=2.2,h=t+2,$fn=24);
  }
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
    fit_box([22,16,3]);
    translate([0,0,-1]) fit_box([otto_usb_slot[0],otto_usb_slot[1],5],clearance);
  }
  if(kind==5) cover_jig();   // drill guide for a head printed before the cover screws
  if(kind==4) {   // shield clips: the top of the back cover with both side clips and the top stops
    yt=otto_shield_top; w=otto_shield[0]/2;
    translate([-w-4,yt-20,0]) cube([2*w+8,24,otto_wall]);
    edge_guide(w,yt-19,yt-2,otto_wall+otto_shield_standoff+otto_shield[2],clearance,otto_shield_snap);
    shield_ledges(yt-19,yt-2,clearance);
    shield_pegs();
  }
  if(kind==3) difference() {   // battery holder tray: footprint and the hip-servo gap width
    fit_box([otto_battery[0]+6,otto_battery[1]+6,8]);
    translate([0,0,3]) fit_box([otto_battery[0],otto_battery[1],10],clearance);
  }
}
