// SPDX-License-Identifier: CC-BY-SA-4.0
// Moldable Otto prototype. Otto DIY: https://www.ottodiy.com
// Fixed numbers ONLY. No user controls or geometry here.
// Reference/provenance and unmeasured interfaces: docs/reference/otto-fit.md.
// Proportions and the 4-servo layout follow the Otto DIY V9 reference parts. Head and body are NEW DESIGN
// envelopes, not measurements of the V9/V13 CAD; the leg and the ankle joint ARE measured from the V13 leg mesh.
otto_wall = 2;
// Body: open-top box; the head drops 3 mm inside it. [width, depth, height]
otto_body = [68,68,38];
otto_body_inner = [64,64];
otto_body_chamfer = 3; // vertical edges
// Head prints face down. [width, height, depth incl. back cover]; the bottom
// otto_head_insert mm sit inside the body. Head-local Y = 0 is the head top.
// One height for every mouth: the electronics bay behind the face is fixed.
otto_head = [63.5,62,69.5]; // 62 tall so the 53.2 mm shield clears every top-corner style
otto_head_insert = 3;
otto_head_band = 63.5; // face-to-rear depth of the insert band; drops into the 64 mm body opening
otto_cover_lip = 3; // back-cover locating lip depth (design allowance)
// Leg (Nov 11): the outside, the 2 mm walls, the 13 x 31 servo bay, the servo's position in it and the closed
// end are those of the official Otto DIY V13 leg (OttoDIYLegV13.stl, MEASURED from the mesh). The builder printed
// that leg and it took their servo, after two legs of our own design did not. [width, length front-back, height]
otto_leg = [17,35,42];
otto_leg_chamfer = 1.5;
otto_leg_top = 5; // closed end: a 2.5 plate with the hip horn's 2.5 pocket inside it (V13)
otto_leg_plate = 2.5;
otto_leg_bay = 13; // servo bay width at the default clearance (V13: 13.0 for a 12.2 case)
// Ear seat: the far ear lies against a block this far behind the leg's front face (V13: 8.5). With the ear
// 3.17 below the flat top the boss ends 1 mm inside the front face and the spline sticks 3 mm out of it.
otto_ankle_seat = 8.5;
otto_ankle_ledge = 17; // block top (the case's far end rests on it) below the ankle axis: a seat, so no clearance (V13: 17.0)
otto_ankle_pad = [2,10.5]; // V13's step behind the front wall, from the block up: [thickness, top below the ankle axis]
// Joints, as on V13. The hip horn lies INSIDE the leg under the plate, so the leg hangs on it; the body rests
// on the leg top by the servo's boss, which ends 1.3 under the floor (1.5 here: the leg hangs 0.2 lower on its horn).
otto_hip_gap = 1.5; // body floor underside to the leg top
otto_ankle_gap = 4; // leg bottom above the sole (V13: 4): a square leg bottom rolls freely (corner radius 13.9 < 15)
otto_ankle_front_gap = 0.5; // leg face to each bracket (V13: 0.4)
otto_ankle_rear_gap = 0.3; // small, so the pivot screw's tip reaches 1.6 mm into the leg's rear wall
// Foot: flat sole + front/back brackets the leg pivots between. [width, length, bracket height]
otto_foot = [40,62,25];
otto_sole = 5;
otto_foot_outboard = 10; // sole centre offset outboard of the leg centre
// Front: 4.0 horn pocket + 1.6 web, exactly V13. A horn screwed down on the boss has its outer face 3.8 in front
// of the leg face and the pocket floor is at 4.5, so the screw head sits 0.8 deep in the web's hole: that head is
// what stops the front of the foot dropping (review, Nov 11: a 1.2 web held it by 0.4). Rear: the pivot screw's
// 7.7 mm thread ends inside the leg's rear wall, 3.5 mm short of the servo.
otto_bracket = [21,5.6,5.8]; // [width, front thickness, rear thickness]
otto_horn_web = 1.6; // front bracket wall left behind the horn pocket
// The user's ASKY MG90S (AliExpress 2251832788894926). MEASURED with calipers Nov 10: case 23.16 long x 12.2 wide
// x 24.17 from the bottom to the flat top (the first print assumed 22.7, so the servo did not go into the leg).
// From the seller's drawing: 28.5 to the top of the boss (so the boss is 4.33), spline 4.0 more, ears 2.7 thick
// with their underside 18.3 up (top face 21.0, i.e. 3.17 below the flat top), 33.4 across, holes 28.0 apart,
// shaft 8.6 from the nearer hole (5.4 off the case centre).
otto_servo = [23.2,12.2,28.5]; // [case length, width, height to the top of the boss]
otto_servo_body = 24.2; // case height, bottom to the flat top (without the boss)
otto_servo_ears = 33.4;
// Round boss around the shaft. UNMEASURED: 11.8 on an SG90, but on these servos it is usually as wide as the
// case, so 12.2 is assumed; the leg's U-slot and the body's floor slot are this + 0.2 + the clearance.
otto_servo_boss = 12.2;
// Hip ear posts: with the ears 3.17 down, the servo's flat top hangs 1 mm above the floor and the boss
// ends 1.3 mm under it.
otto_hip_post = 4.2;
otto_servo_shaft = 5.5; // shaft offset from case centre along the long axis (drawing: 5.4)
otto_servo_ear_hole = 14; // ear screw hole from case centre along the long axis (drawing: 28.0 between holes)
// Nano I/O shield standing upright on the back cover, Nano + Dupont plugs facing the face.
// YwRobot "Nano Sensor Shield" reference; the ZC board is UNMEASURED.
// Blue "Nano IO Expansion Shield V3.0" (the user's ZC board), MEASURED with calipers Nov 9:
// 53.1-53.25 across the side edges, 54.8 from the jack edge, 57.8 including the USB-C.
// The DC jack and the Nano's USB-C stick out of the same edge, which faces up; the Nano is
// centred (user photo). Held by its side edges, not its holes (positions vary between boards).
otto_shield = [53.2,54.8,1.6]; // [width, height, PCB thickness]
// DC jack: [x from, x to, height above the top edge], seen from the face. Height from the builder's caliper
// photos: 57.82 over the jack against 54.79 for the bare board, so 3.03; 3.2 here.
otto_shield_jack = [-20.3,-10.4,3.2];
otto_shield_edge = 4.5; // flat strip along each side edge (no headers): the clips use it
otto_shield_stack = 28.4; // Nano on female headers + Dupont plugs in front of the PCB (provisional)
otto_shield_under = 3; // solder tails behind the PCB (they touched the plate on a test print with no ledges)
// Two top mounting holes (dia 3.2, user calipers: 51.0 across their outer edges, so 47.8 c-c),
// [x seen from the back, depth of the centre below the top edge]; depths from a photo (unmeasured).
otto_shield_holes = [[-23.9,2.8],[23.9,4.0]];
otto_shield_peg = [4.5,2.2]; // stepped peg: [base dia (the PCB rests on it), pin dia through the hole]
otto_shield_snap = 0.8; // clip ridge reach past the PCB edge: 0.3 let the board slip off (it has 0.5 side play)
otto_cover_ribs = [-20,-48]; // y of the crush ribs on each side of the back-cover lip
otto_cover_crush = 0.2; // how far each rib presses into the head wall: 0.25 gap alone was loose (test print)
otto_shield_ledge = 1.2; // ledge under each bare side edge: holds the PCB off the cover, tails clear
otto_nano_usb = [0,11.7,3.0]; // Type-C port: [x, centre height in front of the shield PCB, out past the top edge]
// HC-SR04: Elecfreaks 45 x 20 board; transducers D16 at 27.0 c-c, centred on the board
// (Cytron drawing + calibrated photo, via PartReel hc_sr04). UNMEASURED on your units.
otto_sensor = [45,20,4]; // HC-SR04 PCB + rear parts, behind the transducers
otto_pcb = 1.6; // PCB thickness (both modules)
otto_transducer = [16,12]; // [diameter, height in front of the PCB]
// 0.96" SSD1306 module: the user's YouKeyi boards, MEASURED Nov 9: 24.8 wide (along the screen)
// x 27.05 tall (pins at the bottom), holes 22.8 apart (not used). Active area and its offset
// from the LCDWiki MC096 drawing (https://www.lcdwiki.com/0.96inch_OLED_Module_SKU:MC096VX).
otto_oled = [24.8,27.05,4]; // PCB + glass + rear parts
otto_oled_visible = [21.74,10.86];
otto_oled_glass = 1.5; // glass in front of the PCB (provisional)
otto_oled_offset = 2.1; // active area sits this far toward the pin header from the PCB centre
// Edge mounts (no screw holes: hole positions vary between makers).
otto_guide = [1.6,8,0.3]; // [wall thickness, length along the board edge, snap overlap past the PCB edge]
// Power: 4x AA NiMH (4.8 V) straight to the shield's 5 V rail, like official Otto.
// Two-layer 4xAA holder, LAMPVPATH ASIN B01CVJC8I4, listed 56 x 30 x 28 (UNMEASURED).
otto_battery = [56,30,28]; // [length front-back, width, height]
otto_battery_stop = [3,2,6]; // rear stop posts: [width, depth, height]
otto_usb = [12.35,6.5]; // largest Type-C plug boot the USB spec allows
// Hole in the head top. The port sits about 3.25 mm under the top, so the cable's plastic boot has to pass
// through; chunky braided cables exceed the spec size, hence the extra room (Nov 10).
otto_usb_slot = [14,8];
otto_buzzer = [12,9.5]; // stands on the body floor, sound side down
otto_buzzer_rib = 0.15; // four crush ribs press this far into the nominal buzzer
// KCD11 mini rocker, AUXBC ASIN B0H9YNMTHZ: cutout 13 x 8, flange 15 x 10.5 (UNMEASURED)
otto_switch = [13,8];
otto_switch_flange = [15,10.5];
// Single-arm horn, UNCUT. From the drawing in the MG90S listing the builder says matches theirs (AliExpress
// 1005008315780030): 21.3 long, so 17.9 from the centre to the tip; hub dia 6.76 x 4.82 tall; arm 2.08 thick.
// The V13 pockets leave 17.5 (leg) and 18.4 (foot) for it, which is why the builder had to cut theirs down.
otto_horn_hub = 7; // hub pocket and plate hole are this + 2 x clearance (V13: 7.2)
otto_horn_arm = [6.6,4.4,18.6]; // pocket for the arm: [width at the hub, width at the tip, length from the centre]
otto_horn_tall = [4.82,2.08]; // [hub height, arm thickness], listing drawing
otto_horn_head = 4.4; // hole in the web for the horn screw's 4.26 head (V13: 4.5): the head in it holds the front of the foot up, so it is only just wider than the head
otto_pin = [1.8,1.9]; // ankle pivot = a servo ear screw: [pilot in the rear bracket, bore in the leg's rear wall]
otto_ear_pilot = [1.8,2,7]; // slot the ear screw cuts its thread in: [width, how far below the screw axis it starts x 2, depth]; open upward (V13: a closed dia 2.0 hole 6.7 deep)
otto_wire = [3.2,8.5]; // slot that passes a 3-pin servo plug
otto_wire_y = 27; // body floor slots for the ankle servo leads, behind the hip servos
otto_latch = 0.45; // head-to-body snap: ridge overlap into the body's side walls
// Back-cover cross screws (Nov 10): one spare servo ear screw (about 2 x 8, at most 9 mm under the head) through
// each head side wall into a post on the cover. Crush ribs and a 0.45 mm snap ridge both let the cover slide out
// on the builder's printer, because the head's 2 mm side walls flex; a steel pin through wall and post cannot.
otto_cover_screw = [-36,14]; // [y down the head sides (below every top-corner style), axis in from the cover's OUTSIDE face]: 2.55 in front of the shield PCB
otto_cover_post = [12,19,0.6]; // post on the cover: [length along y, height above the outside face (3.7 of plastic over the pilot), lead-in chamfer]
otto_cover_mark = [2.1,1.2]; // [side of the square that notches each cover edge at the screw height, drill-guide tooth half width = height]
otto_screw_head = 5.5; // well for the screw head and driver shaft; cuts only in grown shells
otto_cover_jig = [14,22,4]; // drill guide for an already printed head: [width, length, thickness]
otto_snap_z = [22,42]; // head-to-body snap: ridge span along the head's insert band, measured back from the face
// NEW DESIGN placements; not verified against V9/V13 or purchased parts.
// Head-local (x across, y down from the top, z back from the face):
otto_eyes = [-13.6,13.6]; // 27.2 c-c: 27.0 printed 0.1-0.2 too close on the user's board (test print, Nov 9)
otto_eye_d = 16.75; // snug press fit that holds the sensor, like official Otto: 17.25 at 0.25 clearance (17.0 was slightly too tight)
otto_eye_y = -15;
otto_nose_y = -30;
otto_nose_d = 6;
otto_grille_y = -28;
otto_sensor_pos = [0,-15,7]; // PCB front face; the eyes stick out 5 mm (the OLED plugs below limit it)
// OLED mounts upside down (pin header at the BOTTOM edge) so its rear plugs pass
// under the HC-SR04's downward plugs; rotate the display 180 degrees in the sketch.
otto_oled_pos = [0,-40,2]; // visible-area centre; the PCB centre sits otto_oled_offset above it
// y of the shield's top edge. Raised 3.5 mm on Nov 10 (the builder found the board too low for the USB-C cable):
// the DC jack now ends 1 mm under the head's roof and the Type-C port 1.25 under it (3.25 under the outside,
// was 6.75). Bevel corners are capped at 8 mm and the dome is 13 mm with an 11 mm cavity corner
// (otto_shells.scad), so the board's corners keep at least 0.6 mm from every head style.
otto_shield_top = -6.25;
otto_shield_rail_top = -11.75; // top of the two side rails: fixed, so they stay inside every head-corner style
otto_shield_standoff = 6.75; // back-cover inner face to the shield PCB back
// Body-local (x across, y front-to-back, z up from the floor underside):
otto_buzzer_pos = [-24.75,-22]; // ring merges into the side wall, clear of the battery holder
otto_hip_x = [-22,22];
otto_hip_y = 0; // shaft axis; the case extends toward the back
otto_battery_pos = [0,-2.5]; // between the hip servos, under the shield; leads leave at the rear end
otto_switch_pos = [24.5,-25.5]; // front right; its flange stays outside the circle a V13-size leg's corners sweep (18.9 mm)
// Leg-local (prints top-down: z = 0 is the leg top):
otto_ankle_z = 11; // shaft axis above the leg bottom
