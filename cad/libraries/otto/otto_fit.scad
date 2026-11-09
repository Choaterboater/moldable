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
otto_head = [63.5,61,69.5];
otto_head_insert = 3;
otto_head_band = 63.5; // face-to-rear depth of the insert band; drops into the 64 mm body opening
otto_cover_lip = 3; // back-cover locating lip depth (design allowance)
// Leg: [width, length front-back, height]; holds the ankle servo.
otto_leg = [16.5,29,38.5];
otto_leg_chamfer = 1.5;
otto_leg_gap = 1; // under the body floor and above the foot sole
// Foot: flat sole + front/back brackets the leg pivots between. [width, length, bracket height]
otto_foot = [40,62,25];
otto_sole = 5;
otto_foot_outboard = 10; // sole centre offset outboard of the leg centre
otto_bracket = [21,4]; // [width, thickness]
// Supplied component reference sizes (purchased variants still unverified).
otto_servo = [22.8,12.2,28.5];
otto_servo_body = 22.7; // SG90 case height without shaft boss
otto_servo_ears = 32.5;
otto_servo_ear_z = 4.2; // shaft face to underside of the mounting ears (provisional)
otto_servo_shaft = 5.5; // shaft offset from case centre along the long axis (provisional)
otto_servo_ear_hole = 14; // ear screw hole from case centre along the long axis (provisional)
// Nano I/O shield standing upright on the back cover, Nano + Dupont plugs facing the face.
// YwRobot "Nano Sensor Shield" reference; the ZC board is UNMEASURED.
otto_shield = [42,60,1.6]; // [width, height, PCB thickness]
otto_shield_holes = [35.56,53.34]; // hole spacing [across, up]; holes 3 mm
otto_shield_stack = 28.4; // Nano on female headers + Dupont plugs in front of the PCB (provisional)
otto_shield_under = 2; // solder joints behind the PCB
otto_standoff = [6,2.5]; // [post diameter, M3 self-tap pilot]
otto_nano_usb = [0,11.7]; // Type-C port centre: [x, height in front of the shield PCB] (provisional)
otto_sensor = [45,20,4]; // HC-SR04 PCB + rear parts, behind the transducers
otto_sensor_holes = [41,16]; // corner holes, 2 mm, centre spacing (generic drawing, unmeasured)
otto_transducer = [16,12]; // [diameter, height in front of the PCB]
// 0.96" SSD1306 module, LCDWiki MC096 drawing (https://www.lcdwiki.com/0.96inch_OLED_Module_SKU:MC096VX):
otto_oled = [27.3,27.8,4]; // PCB + glass + rear parts
otto_oled_visible = [21.74,10.86];
otto_oled_glass = 1.5; // glass in front of the PCB (provisional)
otto_oled_holes = [23.3,23.8]; // 2 mm holes for M2, centre spacing
otto_oled_offset = 2.1; // active area sits this far toward the pin header from the PCB centre
// Face mounts: [post diameter (hole pad), peg pin diameter, M2 self-tap pilot]
otto_face_mount = [3.5,1.7,1.6];
// Power: 4x AA NiMH (4.8 V) straight to the shield's 5 V rail, like official Otto.
// Two-layer 4xAA holder, LAMPVPATH ASIN B01CVJC8I4, listed 56 x 30 x 28 (UNMEASURED).
otto_battery = [56,30,28]; // [length front-back, width, height]
otto_battery_stop = [3,2,6]; // rear stop posts: [width, depth, height]
otto_usb = [12.35,6.5];
otto_buzzer = [12,9.5]; // stands on the body floor, sound side down
otto_buzzer_rib = 0.15; // four crush ribs press this far into the nominal buzzer
// KCD11 mini rocker, AUXBC ASIN B0H9YNMTHZ: cutout 13 x 8, flange 15 x 10.5 (UNMEASURED)
otto_switch = [13,8];
otto_switch_flange = [15,10.5];
otto_horn_hub = 7.4; // provisional, confirm actual supplied horns
otto_horn_arm = [6,4,14]; // single-arm horn: [width at hub, width at tip, length]
otto_horn_depth = 2;
otto_horn_screw = 2.5;
otto_pivot_d = 2.5;
// NEW DESIGN placements; not verified against V9/V13 or purchased parts.
// Head-local (x across, y down from the top, z back from the face):
otto_eyes = [-13.25,13.25]; // spacing unmeasured: provisional design value
otto_eye_d = 16.5; // unmeasured: provisional design value
otto_eye_y = -15;
otto_nose_y = -30;
otto_nose_d = 6;
otto_grille_y = -28;
otto_sensor_pos = [0,-15,12]; // PCB front face; transducer fronts flush with the face
// OLED mounts upside down (pin header at the BOTTOM edge) so its rear plugs pass
// under the HC-SR04's downward plugs; rotate the display 180 degrees in the sketch.
otto_oled_pos = [0,-40,2]; // visible-area centre; the PCB centre sits otto_oled_offset above it
otto_shield_top = -3.5; // y of the shield's top edge; clears the dome's rounded ceiling
otto_shield_standoff = 6.75; // back-cover inner face to the shield PCB back
// Body-local (x across, y front-to-back, z up from the floor underside):
otto_buzzer_pos = [-24.75,-22]; // ring merges into the side wall, clear of the battery holder
otto_hip_x = [-22,22];
otto_hip_y = 0; // shaft axis; the case extends toward the back
otto_battery_pos = [0,-2.5]; // between the hip servos, under the shield; leads leave at the rear end
otto_switch_pos = [24.5,-24]; // front right; its flange stays outside the legs' swing (16.7 mm radius)
// Leg-local (prints top-down: z = 0 is the leg top):
otto_ankle_z = 11; // shaft axis above the leg bottom
