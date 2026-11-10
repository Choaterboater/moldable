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
| MG90S body | 22.8 × 12.2 × 28.5 | TowerPro, supplied plan | |
| MG90S including ears | 32.5 long | Supplied plan, vendor drawing needed | |
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
| MG90S ear thickness, hole pitch, output-axis location | | |
| Supplied single/cross horn outline, depth and screw | | |
| 4×AA holder: size, lead exit side and bend room | | |
| Switch body depth, terminals and flange height | | |
| Shield: V pins on the 5 V rail, or a servo-power jumper | | |
| V13 head/body interface and articulated leg/ankle axes | | |

## New design choices (V9 proportions, not V9 measurements)

`cad/libraries/otto/otto_fit.scad` keeps these fixed. They follow Otto V9's overall
proportions (V9 assembled height 117.5; this head is 25 mm taller for the
electronics, so 142.5) but are prototype allowances, not measurements of the purchased parts:

- Head 63.5 wide × 62 tall × 69.5 deep including the 2 mm back cover, the same for every mouth.
  Its bottom 3 mm band (63.5 deep from the face) drops inside the body; behind the band the head
  rests on the body's rear rim. The face plane is unchanged; the extra 6 mm depth is at the rear. Body 68×68×38 with 3 mm chamfered vertical edges, cavity 64×64.
  Leg 16.5×29×38.5; foot sole 40×62×5 with front/rear brackets, sitting 10 mm outboard of the leg.
- Four MG90S servos: two hip servos stand shaft-down on the body floor at X ±22 (posts carry the ears,
  the shaft passes the floor into the leg's horn recess); one ankle servo inside each leg, shaft forward,
  driving a horn recessed in the foot's front bracket, with a Ø2.5 pivot pin through the rear bracket.
- Head prints face-down with open underside and rear. HC-SR04 eyes at X ±13.6, Y −15 from the head
  top, Ø16.75 holes (17.25 printed at 0.25 clearance: a snug press fit; 17.0 was slightly too tight); its 4-pin header points down, plugs hang 20 mm below the board. Nose Ø6 at Y −30,
  OLED window centre Y −40 (mouth 1) or three grille slots (mouth 2).
- OLED mounts upside down (header at the bottom edge) so its rear plugs pass 4 mm under the HC-SR04
  plugs; rotate the display 180° in software. With the header at the top the two sets of plugs
  crossed (12 × 5 × 4.5 mm), found by the Nov 1 fit check.
- Nano I/O shield (Nov 9, measured): the blue V3.0 board, 53.2 wide × 54.8 tall, stands upright with the DC
  jack and USB-C edge up, PCB back 6.75 mm in front of the back cover, top edge 9.75 mm under the head top so
  its corners clear a 12 mm bevel (the tightest corner style); that is why the head grew from 61 to 62 mm.
  The stack in front (24–25 mm measured to the top pin; 28.4 allowed for plugs and wire bends) reaches y −1 in
  the assembled frame, 2.25 mm behind the OLED plugs. Its lower 4.5 mm sits in the body, 2.5 mm above the
  battery holder. Two 1.6 mm side clips on the cover (snap ridges 0.3 mm past the PCB edges, inside the 4.5 mm
  header-free edge strips), two 1.2 mm edge ledges and two stepped pegs in its top mounting holes hold it.
  No screws.
- The Nano's Type-C port points up; a 12.85 × 7.0 slot with a 45° rear gable passes through the head top.
  The old rails could not take a Nano with soldered headers (pin rows hit the rail lips), so they are gone.
- Back cover: U-shaped 3 mm lip and the two shield clips; it stops at the body rim.
- Power (Nov 2026): 4×AA NiMH (4.8 V) straight to the shield's 5 V rail, as official Otto does, replacing the
  9 V cell (USB-C 9 V Li-ion cells are typically rated 0.35–0.5 A continuous, and a linear 5 V regulator
  would burn the extra 4 V as heat). The two-layer holder sits between the hip servo cases (31.8 gap, 0.9 per
  side) at Y −2.5, under the shield (2.5 mm gap), with two 3 × 2 × 6 rear stop posts at X ±10 leaving the middle
  free for its leads. The 9 V ribs, strap slots, clip allowance and DC jack are gone.
- Body floor: KCD11 rocker cutout 13 × 8 (plus clearance) at X 24.5, Y −24; its 15 × 10.5 flange stays 18.75 mm
  from the right hip axis, outside the 16.7 mm leg swing. Buzzer ring at X −24.75, Y −22 (merged into the side
  wall) with a Ø5 sound hole through the floor.
- Assembly order: shield on cover, leads plugged in, cover into head, head into body. Lift the head out
  before removing the cover (the shield's lower edge is behind the body's rear wall).
- Provisional horn hub Ø7.4 / single arm 14 long / screw Ø2.5, recessed 2 mm with 45° roofs.
- Provisional USB opening 12.85×7.0 at clearance 0.25. It is sized for the cable's plastic boot, not the
  port: the Nano's port sits about 7 mm under the head top, so the boot has to pass through the wall.
  The real plastic cable boot may be larger or smaller.
- Shield ledges (Nov 9, after a test print): with only the snap ridges, the shield slid back until its
  solder tails touched the cover. Two 1.2 mm ledges under its bare side edges now hold the PCB back
  6.75 mm off the cover (tails up to 3 mm clear); the snap ridges hold it from the front.
- Shield pegs (Nov 9, after the same print): the two top stops ended up inside the shield's top mounting
  holes but sat too close together. They are now stepped pegs in those holes: a Ø4.5 base the PCB rests
  on, then a Ø2.2 pin with a pointed tip. Holes Ø3.2, 51.0 across their outer edges (user calipers), so
  47.8 c-c. Hole depths below the top edge (2.8 jack side, 4.0 other side) are from a photo; the
  1 mm of play around each pin covers that.
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
  (Ø1.8 teardrop pilot 14 mm from the case centre), with a Ø4 teardrop access hole through the rear wall.
- Every purchased-hardware number above is a reference value. Re-check with calipers when the parts arrive.
- No claim of V9 or V13 part interchangeability.

Shell growth changes XY exterior only. Rounded, bevel and dome styles shape the head's top corners
outside the fixed core; the dome radius is capped at 14 mm so the sensor board and shield stay enclosed.
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
