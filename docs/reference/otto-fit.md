# Otto fit record

Status: **prototype — not physically accepted**. No caliper measurements or prints
were performed during this build. A passing collision test proves only that the
coded component envelopes do not overlap plastic; it cannot prove actual fit,
retention, assembly, horn alignment or walking kinematics.

`test/otto-electronics.test.mjs` places every component **with its plugs** in the
assembled robot (`test/fixtures/otto-electronics.mjs`, independent numbers) and checks
it against every printed part, for every head style × mouth × shell extreme and both
clearance limits, and against every other component. A control case proves a real
collision is detected.

## Source ledger

- User build plan: `C:\Users\choat\Desktop\moldable-otto-plan.md` and accepted
  follow-up dimensions. Values below are reported reference values, not newly
  verified datasheet measurements. Exact component drawings still need checking.
- Purchased-product references (contents inaccessible to the available web reader):
  https://www.amazon.com/dp/B01AXIEDX8 and https://www.amazon.com/dp/B0FXGP9VPT .
  Product identity and dimensions have **not** been inferred from ASINs.
- [Official Otto design page](https://www.ottodiy.com/design) links to
  [V13 source files](https://www.printables.com/model/31955-otto-diy-build-your-own-robot/files).
  The design page was accessible; Printables returned HTTP 403. No STEP/Fusion
  file was obtained or measured. This implementation is not a V13 geometry copy.
- [Modular Otto / Martin Perdeaux](https://www.printables.com/model/230575-otto-modular-robot-customizable-with-openscad/files)
  is a styling reference only; its source was not downloaded or copied.
- [Otto DIY V9 sources on GitHub](https://github.com/Open-Hardware-Leaders/OttoDIY)
  (`3Dprint/*.stl`, `CAD/OttoDIY_CUSTOM.scad`) were read for overall proportions
  and the four-servo leg/foot layout only. No mesh or code was copied; the
  repository carries no separate license file, so Otto DIY's CC-BY-SA-4.0 applies.
- [HP Robots customizer](https://hprobots.com/customizer/) was viewed as a look and
  part-picker reference only. None of its branding, files or geometry is used.
- [H2C manufacturer specifications](https://bambulab.com/en/h2c/specs):
  left 325×320×320, right 305×320×325, dual 300×320×320 mm (W×D×H).
  The combined 330×320×320 figure is not the dual-nozzle envelope.

## Reported component references

Blank actual fields mean **unmeasured**, not zero. Units: mm.

| Feature | Reported reference | Reported source | Actual / caliper |
|---|---|---|---|
| USB-C plug envelope | 12.35 × 6.5 | USB Type-C R2.1, supplied plan | |
| USB-C mating section | 8.25 × 2.4 | USB Type-C R2.1, supplied plan | |
| USB-C port opening | 8.34 × 2.56 | USB Type-C R2.1, supplied plan | |
| MG90S body | 22.8 × 12.2 × 28.5 | TowerPro, supplied plan | **Case 23.16 long × 12.2 wide × 24.17 to the flat top (user calipers, Nov 10)**; 28.5 to the boss top, so boss 4.33, and spline 4.0 (seller drawing, ASKY, AliExpress 2251832788894926) |
| MG90S including ears | 32.5 long | Supplied plan, vendor drawing needed | 33.4 across (seller drawing; user read about 32.5) |
| HC-SR04 board envelope | 45 × 20 × 15 | ElecFreaks, supplied plan | |
| Nano board | 43.2 × 18; clone about 43 × 18 | Arduino, supplied plan | |
| Nano mounting holes | Ø1.8 | Arduino, supplied plan | |
| Nano I/O shield (blue "Nano IO Expansion Shield V3.0") | 53.2 × 54.8; 57.8 incl. USB-C; DC jack 4 out, same edge; 24–25 tall to the top pin | [NZN datasheet](https://www.nznelectronics.co.nz/products/nano-io-expansion-shield-v3-0-servo-sensor-breakout-board-arduino-nano-compatible-blue) (~54.5 × ~57) | **53.1–53.25 × 54.8, 57.82 with USB-C, 24–25 high (user calipers, Nov 9)** |
| Shield stack in front of the PCB | 28.4 (Nano on female headers + Dupont plugs) | Nov 1 fit check estimate | |
| Type-C port on the shield | centred, 11.7 in front of the PCB, at the top edge, pointing up | Estimate: 8.5 female header + 1.6 PCB + half the receptacle | |
| OLED board | 24.8 × 27.05, holes 22.8 apart (not used); active area 21.74 × 10.86, 2.1 toward the header (LCDWiki) | [LCDWiki MC096 drawing](https://www.lcdwiki.com/0.96inch_OLED_Module_SKU:MC096VX) (active area) | **24.8 × 27.05, holes 22.8 (user calipers, Nov 9)** |
| HC-SR04 transducers | Ø16 at 27.0 c-c, centred on the board; 12 tall (holes 40 × 15, not used) | [PartReel hc_sr04](https://partreel.com/p/hc_sr04/): Cytron drawing + calibrated photo | **27.0 printed 0.1–0.2 too close; now 27.2 (test print, Nov 9)** |
| OLED visible screen | 21.74 × 10.86 | Supplied plan, module drawing needed | |
| Buzzer | Ø12; height 8.5–9.5; pins 6.5 apart | Supplied plan, vendor drawing needed | |
| 4×AA two-layer holder | 56 × 30 × 28 (L × W × H) | [LAMPVPATH listing, Amazon B01CVJC8I4](https://www.amazon.com/dp/B01CVJC8I4) | |
| KCD11 mini rocker switch | cutout 13 × 8, flange 15 × 10.5 | [AUXBC listing, Amazon B0H9YNMTHZ](https://www.amazon.com/dp/B0H9YNMTHZ) | |
| Barrel plug | 5.5 × 2.1; insertion length 9.5 | Switchcraft, supplied plan | |

## Missing interfaces — do not certify fit until measured

| Interface | Actual measurement | Source / evidence |
|---|---|---|
| Cable plastic boot and bend space | | |
| Type-C port position on HNX Nano | | |
| ZC shield outline | 53.2 × 54.8 (holes not used) | User calipers, Nov 9 |
| ZC shield: Nano position and USB direction, header heights, solder-side depth | | |
| OLED header side (pins out the back assumed) and plug length | | |
| HC-SR04 header plug length below the board | | |
| HC-SR04 eye diameters and spacing | | |
| HC-SR04 retaining details | | |
| OLED mounting holes | | |
| MG90S ear thickness, hole pitch, output-axis location | 2.7 thick, underside 18.3 from the bottom (nearer face 3.17 below the flat top); holes 28.0 apart; shaft 8.6 from the nearer hole (5.4 off centre); cable leaves the end away from the shaft | Seller drawing and photo + user calipers |
| Supplied single/cross horn outline, depth and screw | | |
| 4×AA holder: size, lead exit side and bend room | | |
| Switch body depth, terminals and flange height | | |
| Shield: V pins on the 5 V rail, or a servo-power jumper | | |
| V13 head/body interface and articulated leg/ankle axes | | |

## New design choices (V9 proportions, not V9 measurements)

`cad/libraries/otto/otto_fit.scad` keeps these fixed. They follow Otto V9's overall
proportions (V9 assembled height 117.5; this head is 25 mm taller for the
electronics and the V13-size legs and joints need 7 mm more, so 149.5) but are prototype allowances, not measurements of the purchased parts:

- Head 63.5 wide × 62 tall × 69.5 deep including the 2 mm back cover, the same for every mouth.
  Its bottom 3 mm band (63.5 deep from the face) drops inside the body; behind the band the head
  rests on the body's rear rim. The face plane is unchanged; the extra 6 mm depth is at the rear. Body 68×68×38 with 3 mm chamfered vertical edges, cavity 64×64.
  Leg 17×35×42 (the official V13 leg's outside); foot sole 40×62×5 with front/rear brackets, sitting 10 mm outboard of the leg.
- Four MG90S servos: two hip servos stand shaft-down on the body floor at X ±22 (posts carry the ears,
  the shaft passes the floor into the horn inside the leg top); one ankle servo inside each leg, shaft forward,
  driving a horn recessed in the foot's front bracket, with a servo-screw pivot through the rear bracket.
- Head prints face-down with open underside and rear. HC-SR04 eyes at X ±13.6, Y −15 from the head
  top, Ø16.75 holes (17.25 printed at 0.25 clearance: a snug press fit; 17.0 was slightly too tight); its 4-pin header points down, plugs hang 20 mm below the board. Nose Ø6 at Y −30,
  OLED window centre Y −40 (mouth 1) or three grille slots (mouth 2).
- OLED mounts upside down (header at the bottom edge) so its rear plugs pass 4 mm under the HC-SR04
  plugs; rotate the display 180° in software. With the header at the top the two sets of plugs
  crossed (12 × 5 × 4.5 mm), found by the Nov 1 fit check.
- Nano I/O shield (Nov 9, measured): the blue V3.0 board, 53.2 wide × 54.8 tall, stands upright with the DC
  jack and USB-C edge up, PCB back 6.75 mm in front of the back cover, top edge 6.25 mm under the head top
  (raised 3.5 mm on Nov 10: the builder found the board too low for the USB-C cable). The DC jack, measured 3.03
  above the top edge (caliper photos: 57.82 over the jack, 54.79 bare board), ends 1 mm under the roof. To keep
  the board's corners clear, bevel corners are capped at 8 mm and the dome is 13 mm with an 11 mm cavity corner.
  The stack in front (24–25 mm measured to the top pin; 28.4 allowed for plugs and wire bends) reaches y −1 in
  the assembled frame, 2.25 mm behind the OLED plugs. Its lower 2 mm sits in the body, 6 mm above the
  battery holder. Two 1.6 mm side clips on the cover (snap ridges 0.3 mm past the PCB edges, inside the 4.5 mm
  header-free edge strips), two 1.2 mm edge ledges and two stepped pegs in its top mounting holes hold it.
  No screws.
- The Nano's Type-C port points up; a 14.5 × 8.5 slot with a 45° rear gable passes through the head top
  (Nov 10: enlarged from 12.85 × 7.0 so a cable boot bigger than the USB spec still reaches the port; the shield
  was then also raised 3.5 mm, as far as the DC jack allows, with bevel corners capped at 8 mm and the dome at 13).
  The old rails could not take a Nano with soldered headers (pin rows hit the rail lips), so they are gone.
- Back cover: U-shaped 3 mm lip and the two shield clips; it stops at the body rim. It is PINNED by two spare servo
  ear screws (about 2 × 8; at most 9 mm under the head), one through each head side wall into a 12 × 2.65 post
  19 tall on the cover, on an axis 36 mm below the head top and 14 mm in from the cover's outside face (2.55 mm in
  front of the shield PCB's bare edge strip; tip 1.65 mm from the plug envelope). Nov 10: crush ribs and then a
  0.45 mm snap ridge both let the cover slide out on the builder's printer, because the 2 mm head walls flex; a
  steel pin through wall and post cannot. The shield's snap ridge is left out for 14 mm at each post. A head
  printed earlier gets its two pilots drilled through the printed guide (otto_coupon(5), exported as otto-cover-drill-guide.stl; the app's fit-test buttons stop at kind 4): mark the wall through the guide with the bare cover in, take the cover OUT, then drill, because the post's pilot 0.25 mm behind the wall is the screw's only thread. The old history: A 50° ridge 18 mm long on
  each side of the lip (Y −40 to −22, 0.45 mm into the wall) snaps into a groove in the head's side walls, so the
  cover stays on without glue (Nov 10: the first print's cover had nothing holding it). Push it out from inside.
- Head on body (Nov 10): the same 50° ridge, 20 mm long, on each side of the head's 3 mm insert band (22–42 mm
  back from the face) clicks into a groove 1.5 mm under the body rim. The band's free bottom edge flexes inward.
  The ridges run straight up when the head prints face-down, with a ramped lower end.
- Power (Nov 2026): 4×AA NiMH (4.8 V) straight to the shield's 5 V rail, as official Otto does, replacing the
  9 V cell (USB-C 9 V Li-ion cells are typically rated 0.35–0.5 A continuous, and a linear 5 V regulator
  would burn the extra 4 V as heat). The two-layer holder sits between the hip servo cases (31.8 gap, 0.9 per
  side) at Y −2.5, under the shield (6 mm gap), with two 3 × 2 × 6 rear stop posts at X ±10 leaving the middle
  free for its leads. The 9 V ribs, strap slots, clip allowance and DC jack are gone.
- Body floor: KCD11 rocker cutout 13 × 8 (plus clearance) at X 24.5, Y −25.5; its 15 × 10.5 flange stays 20.25 mm
  from the right hip axis, outside the 19.1 mm circle the corners of a V13-size leg sweep. Buzzer ring at X −24.75, Y −22 (merged into the side
  wall) with a Ø5 sound hole through the floor.
- Assembly order: hip servos into the body; a horn into each leg's top pocket from inside, leg onto the hip shaft,
  horn screw driven from the leg's open end; ankle servo up into the leg, far ear first, cable up the back of the
  servo and out of the rear window, one ear screw through the window into the block; horn onto the ankle shaft, leg
  down into the foot, horn screw from the front, pivot screw from the rear; then shield on cover, leads plugged in,
  cover into head, one ear screw through each head side wall into the cover posts, head into body. Lift the head
  out and take both screws out before removing the cover (the shield's lower edge is behind the body's rear wall).
- Legs and feet (Nov 11): REBUILT ON THE OFFICIAL OTTO DIY V13 LEG. Two legs of our own layout (a 24.7 mm bay
  exactly as deep as the servo) did not take the builder's servo. They then printed the official parts
  (MakerWorld 1307980, OttoDIYLegV13.stl / OttoDIYFootL/RV13.stl, CC BY-SA) and those worked once the servo arm
  was cut shorter. Their photo also shows why ours could not: the cable leaves the case bottom at the SHAFT end
  and runs along the back of the servo, where our bay left 0.25 mm. The numbers below were MEASURED from that
  mesh (cross-sections of the builder's copy), not taken from a drawing:
  - V13 leg: 17 × 35 × 42 outside, 2 mm walls, bay 13.0 × 31.0; closed end 5 thick = 2.5 plate + 2.5 horn pocket
    inside, plate hole Ø7.24; ankle axis 11 above the open end; U-slot 12.25 wide; block in the front of the bay
    whose top (17.0 from the axis) carries the case's far end and whose rear face (8.5 behind the front face) is
    the ear seat, with a blind Ø2.0 pilot 6.7 deep, 2.5 below the block top; screwdriver hole in the rear wall on
    that line; Ø5 hemisphere pivot on the rear wall. V13 foot: brackets 5.6 / 5.8 thick, 0.4 from the leg, 4 mm
    deep teardrop horn pocket ending 18.4 below the axis, axis 19 above the ground, leg bottom 4 above the sole.
    V13 body: Ø12 boss hole, ear posts 8.5 and 19.5 from the shaft (ours already matched).
  - Ours keeps all of those dimensions and the servo's position, so the 3.5 mm behind the servo for the cable is
    the same. Differences, each on purpose: the horn pockets take the horn UNCUT (17.9 from the centre per the
    listing drawing the builder says matches, AliExpress 1005008315780030; V13 leaves 17.5 in the leg and 18.4 in
    the foot, hence the cutting): in the leg the arm pocket runs out through the rear wall, in the foot it is
    18.85 long (4.0 deep with a 1.6 web, as V13) and the ankle axis is 20 above the ground; the ear pilot is a 1.8 mm slot open to the block top, so
    a hole nearer the case than the drawing says still catches; U-slot 12.9; one rear window (9 wide, from the
    plate to 13.5 with a gable) serves the plug, the screwdriver and the horn arm instead of V13's side windows;
    the rear pivot is a servo ear screw in a Ø1.8 pilot (rear gap 0.3; its 7.7 mm thread reaches 1.6 into the leg's 2 mm rear wall, Ø2.4 bore)
    instead of a printed hemisphere, because the front bracket's keyhole is open to its top: the leg drops in
    with the horn on the servo and nothing has to be bent.
  - Hip: as V13. The horn lies inside the leg under the plate, so the leg hangs on its arm and cannot drop off;
    the body rests on the leg top by the servo's boss (1.3 under the floor; modelled gap 1.5). Posts stay 4.2 tall.
    The official V13 leg has the same closed end, so it also hangs on this body (its rear bump sweeps a 20.0 mm
    radius under the floor; the switch flange is 20.25 away).
  - Stack per the drawing (ear 3.17 below the flat top): flat top 5.33 behind the leg's front face, boss end 1.0
    inside it, spline tip 3.0 in front of it; bracket face at 0.5, pocket floor at 4.5. A horn screwed down on the
    boss has its outer face at 3.8, leaving 0.7; its screw head sits about 0.8 deep in the web's hole and is what
    keeps the front of the foot up. Limit: ear offset plus any horn stand-off up to 3.85 (4.15 using the leg's
    rear gap); beyond that the hub bottoms in the pocket. V13 has the same limit. The hip posts (4.2) take an ear
    offset up to 4.2 before the case meets the floor. MEASURE the ear face to the flat top before printing a set.
  - Reviews (Nov 11, two independent passes against the V13 mesh): web hole reduced to Ø4.9 so the screw head
    carries the front of the foot with 0.3 play, web 1.6, rear gap 0.3 with a Ø2.4 pivot bore, block top at V13's
    17.0 below the axis, V13's 2 mm step behind the front wall restored. Known and accepted: the keyhole is open
    to the bracket top (V13's pocket is closed and the foot is sprung on), so without the horn screw the front of
    the foot is not held.
  - UNVERIFIED on hardware: nothing above has been printed. Boss diameter and the ear's height on the case are
    still unmeasured.
  - Body floor: a 9 × 3.7 slot behind each hip servo (Y 27) passes the ankle servo's plug.
  - The head-to-body snap exists only for Shell growth ≤ 1; thicker shells cannot flex, so they keep the plain slip
    fit. The cover screws work at every growth (a 5.5 mm well lets the screw head reach the standard wall).
  - Independent review (Nov 10) found and fixed: horn pocket 1 mm too shallow for a horn with a closed end, the
    pivot screw reaching the servo case, the ear-screw access hole (Ø4) smaller than the screw head (now the lead window),
    and pockets too narrow at the cut end of a trimmed horn.
- Provisional USB opening 14.5×8.5 at clearance 0.25 (boot allowance 14 × 8; spec maximum 12.35 × 6.5). It is sized for the cable's plastic boot, not the
  port: the Nano's port sits about 3.25 mm under the head top (6.75 before the board was raised), so the boot still has to enter the wall.
  The real plastic cable boot may be larger or smaller.
- Shield ledges (Nov 9, after a test print): with only the snap ridges, the shield slid back until its
  solder tails touched the cover. Two 1.2 mm ledges under its bare side edges now hold the PCB back
  6.75 mm off the cover (tails up to 3 mm clear); the snap ridges hold it from the front.
- Shield pegs (Nov 9, after the same print): the two top stops ended up inside the shield's top mounting
  holes but sat too close together. They are now stepped pegs in those holes: a Ø4.5 base the PCB rests
  on, then a Ø2.2 pin with a pointed tip. Holes Ø3.2, 51.0 across their outer edges (user calipers), so
  47.8 c-c. Hole depths below the top edge (2.8 jack side, 4.0 other side) are from a photo; the
  1 mm of play around each pin covers that.
- Clip grip and cover ribs (Nov 10, after a test print): the shield lifted off the clips, because each
  snap ridge reached only 0.3 mm past the PCB edge while the board has 0.5 mm of side play. The shield
  ridges now reach 0.8 mm (the face guides keep 0.3). The back cover was loose at the plain 0.25 gap, so
  the lip has two crush ribs per side (y −20 and −48) that press 0.2 mm into the head walls at any
  clearance, with a lead-in at the tip.
- Face mounts (Nov 9, after a test print): hole-based posts were dropped, because the first print's posts
  didn't line up with the real boards (the generic 41 × 16 HC-SR04 grid was off; better data says 40 × 15,
  and hole positions vary between makers). Both modules are now held by their edges:
  - HC-SR04: PCB front 5 mm behind the face (local z 7), so the eyes stick out 5 mm (limited by the
    OLED plugs below). Held like official Otto, by the eyes pressed into snug holes; four 3 × 3 corner
    pads carry the PCB and two solid 2 × 8 side guides (no snap) keep it square. Snap arms 8.7 mm tall
    broke on a test print (Nov 9), so they were dropped.
  - OLED: glass on the face plate, side guides with the same snap ridges, and two 5 × 1.6 stops under
    the bottom corners (clear of the header). The eye cans sit 1 mm above its top edge.
  - The OLED PCB centre sits 2.1 above the window so the upside-down active area stays centred in it.
  - The "Face mounts" fit test is a strip of the face with both mounts, for checking the real boards.
- Retention: four 1 mm crush ribs in the buzzer ring press 0.15 mm into a nominal Ø12 buzzer. In each leg a seat in front of the top ear takes the ear screw
  (Ø1.8 teardrop pilot 14 mm from the case centre), driven from the leg's front face: it threads through the front wall and the seat (5 mm of plastic) and its tip pins the ear's hole, clear of the cable.
- Every purchased-hardware number above is a reference value. Re-check with calipers when the parts arrive.
- No claim of V9 or V13 part interchangeability.

Shell growth changes XY exterior only. Rounded, bevel and dome styles shape the head's top corners
outside the fixed core; the dome is a fixed 13 mm (11 mm cavity corner) and bevel corners stop at 8 mm, so the sensor board and the raised shield's corners stay enclosed.
Accessories are flat-backed extensions printed on the bed, not floating hats.
The fixed cavity subtraction is applied after accessories are added.

## Fit-test prints (also called coupons)

These are small samples of the real openings. They are **not printer corners**.
Start with clearance **0.25 mm**, then change only that setting in 0.05 mm steps
within 0.1–0.5 mm. Clearance is applied per side. Do not force hardware into a
sample or call it passed merely because it renders.

| Check | Expected result | Status | Clearance | Evidence |
|---|---|---|---|---|
| Servo pocket | Actual MG90S pushes in snugly by hand | pending | | |
| Face mounts | Real HC-SR04 and OLED snap in and stay put; eyes stick out | pending | | |
| Type-C | Actual cable plugs into the mounted Nano | pending | | |
| Battery | Loaded 4×AA holder drops into the tray without force | pending | | |

**Validated clearance default:**

The Type-C and battery samples test their opening/envelope only. Until the real
board standoffs, cable position and closure are measured, their complete assembly
acceptance is still pending; a loose sample alone must not mark those checks done.
Record separate statuses in `docs/reference/otto-acceptance.json`.

## Physical acceptance

Every support-free real print, component fit, final assembly and assembled cable
check is pending. See `test/otto-physical.test.mjs` for separately named pending
physical checks. Electrical validation and walking trials are deferred by request.
