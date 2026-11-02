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
otto_head = [63.5,37,63.5];
otto_head_insert = 3;
otto_oled_extra = 24; // head grows downward by this when the OLED mouth is fitted
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
otto_nano = [43.2,18,4]; // board thickness envelope is provisional
otto_sensor = [45,20,4]; // HC-SR04 PCB + rear parts, behind the transducers
otto_transducer = [16,12]; // [diameter, height in front of the PCB]
otto_oled = [27,27,4];
otto_oled_visible = [21.74,10.86];
otto_battery = [48.5,17.5,26.5]; // 6F22 on its side
otto_clip_size = [18,8,20]; // snap + wire allowance at the battery terminal end
otto_usb = [12.35,6.5];
otto_buzzer = [12,9.5];
otto_switch = [13,9]; // provisional, measure switch before assembly
otto_jack_d = 8; // provisional panel socket, not the 5.5mm plug
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
otto_oled_pos = [0,-40,2];
otto_nano_pos = [0,-6.5,37.8]; // lies under the head top, USB end toward the cover
otto_nano_rail_z = 20;
// Back-cover-local (x across, y as head, z inward from the outside face):
otto_usb_pos = [0,-6.5];
otto_buzzer_pos = [-18,-24];
// Body-local (x across, y front-to-back, z up from the floor underside):
otto_hip_x = [-22,22];
otto_hip_y = 0; // shaft axis; the case extends toward the back
otto_battery_pos = [0,-3.75];
otto_clip_pos = [0,24.5];
otto_jack_pos = [-18,27];
otto_switch_pos = [17,27];
// Leg-local (prints top-down: z = 0 is the leg top):
otto_ankle_z = 11; // shaft axis above the leg bottom
