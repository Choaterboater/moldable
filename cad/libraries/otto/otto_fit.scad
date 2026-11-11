// SPDX-License-Identifier: CC-BY-SA-4.0
// Moldable Otto prototype. Otto DIY: https://www.ottodiy.com
// Fixed numbers ONLY. No user controls or geometry here.
// Reference/provenance and unmeasured interfaces: docs/reference/otto-fit.md.
// Proportions and the 4-servo layout follow the Otto DIY V9 reference parts;
// these are NEW DESIGN envelopes, NOT measurements of the V9/V13 CAD.
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
// Leg: [width, length front-back, height]; holds the ankle servo.
otto_leg = [16.5,29,38.5];
otto_leg_chamfer = 1.5;
// Joint gaps (Nov 10): the old single 1 mm gap left no room for the servo boss, spline and horn.
otto_hip_gap = 3; // body floor underside to the leg top: the servo boss and the horn hub sit here (the horn sets the real gap)
otto_ankle_gap = 2.5; // leg bottom above the sole: the leg and its servo ear can roll 30 degrees about the ankle axis
otto_ankle_front_gap = 3; // leg front face to the front bracket: an MG90S boss sticks about 2.5 out of the leg
otto_ankle_rear_gap = 1.5; // leg rear face to the rear bracket
// Foot: flat sole + front/back brackets the leg pivots between. [width, length, bracket height]
otto_foot = [40,62,25];
otto_sole = 5;
otto_foot_outboard = 10; // sole centre offset outboard of the leg centre
// Front: 4.8 horn pocket + 1.2 web = room for boss 5.6 + spline 4 + a 1 mm horn end wall. Rear: thick enough
// that an 8 mm pivot screw stops about 1 mm short of the servo case wherever the foot sits (review, Nov 10).
otto_bracket = [21,6,5]; // [width, front thickness, rear thickness]
otto_horn_web = 1.2; // front bracket wall left behind the horn pocket
// Supplied component reference sizes (purchased variants still unverified).
otto_servo = [22.8,12.2,28.5];
otto_servo_body = 22.7; // SG90 case height without shaft boss
otto_servo_ears = 32.5;
// Shaft face to the NEARER face of the mounting ears: about 1.8 on an MG90S, 4.2 on an SG90
// (UNMEASURED on the user's servos). Seats use the smaller value so either servo slides in.
otto_servo_ear_z = 1.8;
// Hip ear posts: an SG90 then rests on the floor and an MG90S hangs 2.4 above it; either way
// the boss ends 1-2 mm under the floor.
otto_hip_post = 4.2;
otto_servo_shaft = 5.5; // shaft offset from case centre along the long axis (provisional)
otto_servo_ear_hole = 14; // ear screw hole from case centre along the long axis (provisional)
// Nano I/O shield standing upright on the back cover, Nano + Dupont plugs facing the face.
// YwRobot "Nano Sensor Shield" reference; the ZC board is UNMEASURED.
// Blue "Nano IO Expansion Shield V3.0" (the user's ZC board), MEASURED with calipers Nov 9:
// 53.1-53.25 across the side edges, 54.8 from the jack edge, 57.8 including the USB-C.
// The DC jack and the Nano's USB-C stick out of the same edge, which faces up; the Nano is
// centred (user photo). Held by its side edges, not its holes (positions vary between boards).
otto_shield = [53.2,54.8,1.6]; // [width, height, PCB thickness]
otto_shield_jack = [-20.3,-10.4,4]; // DC jack: [x from, x to, height above the top edge], seen from the face
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
// Hole in the head top. The port sits about 7 mm under the top, so the cable's plastic boot has to pass
// through; chunky braided cables exceed the spec size, hence the extra room (Nov 10).
otto_usb_slot = [14,8];
otto_buzzer = [12,9.5]; // stands on the body floor, sound side down
otto_buzzer_rib = 0.15; // four crush ribs press this far into the nominal buzzer
// KCD11 mini rocker, AUXBC ASIN B0H9YNMTHZ: cutout 13 x 8, flange 15 x 10.5 (UNMEASURED)
otto_switch = [13,8];
otto_switch_flange = [15,10.5];
otto_horn_hub = 7.4; // provisional, confirm actual supplied horns
// Single-arm horn TRIMMED to 11 from the centre: [width at hub, width at the cut, length]. A 6-to-4 arm 14 long
// is still 4.43 wide where it is cut.
otto_horn_arm = [6,4.5,11];
otto_horn_depth = 2; // hip pocket in the leg top
otto_horn_head = 5.3; // horn screw head + driver tip: the head bears on the horn itself, so the stock screw reaches
otto_horn_rib = 0.15; // crush ribs in the hip pocket press this far into the nominal arm
// Ear screw head (UNMEASURED, typically 3.8-4.2): it passes the leg's rear wall to reach the ankle servo ear.
// Not 4.5: that hole would exactly touch the servo cavity's roof at every clearance.
otto_ear_head = 4.6;
otto_pin = [1.8,2.2]; // ankle pivot = a servo ear screw: [pilot in the rear bracket, bore in the leg's rear wall]
otto_wire = [3.2,8.5]; // slot that passes a 3-pin servo plug
otto_wire_y = 27; // body floor slots for the ankle servo leads, behind the hip servos
otto_latch = 0.45; // back-cover snap: ridge overlap into the head's side walls
otto_latch_z = 1.7; // ridge centre above the root of the cover lip
otto_latch_y = [-40,-22]; // ridge span down the head sides (below every top-corner style)
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
otto_shield_top = -9.75; // y of the shield's top edge: its corners clear a 12 mm bevel (the tightest style)
otto_shield_standoff = 6.75; // back-cover inner face to the shield PCB back
// Body-local (x across, y front-to-back, z up from the floor underside):
otto_buzzer_pos = [-24.75,-22]; // ring merges into the side wall, clear of the battery holder
otto_hip_x = [-22,22];
otto_hip_y = 0; // shaft axis; the case extends toward the back
otto_battery_pos = [0,-2.5]; // between the hip servos, under the shield; leads leave at the rear end
otto_switch_pos = [24.5,-24]; // front right; its flange stays outside the legs' swing (16.7 mm radius)
// Leg-local (prints top-down: z = 0 is the leg top):
otto_ankle_z = 11; // shaft axis above the leg bottom
