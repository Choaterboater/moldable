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
| Nano I/O shield | 60 × 42, Ø3 holes at 53.34 × 35.56 | YwRobot Nano Sensor Shield (the ZC board may differ) | |
| Shield stack in front of the PCB | 28.4 (Nano on female headers + Dupont plugs) | Nov 1 fit check estimate | |
| Type-C port on the shield | centred, 11.7 in front of the PCB, at the top edge, pointing up | Estimate: 8.5 female header + 1.6 PCB + half the receptacle | |
| OLED board | 27.3 × 27.8; glass 26.7 × 19.27; 2 mm holes at 23.3 × 23.8; active area 2.1 toward the header | [LCDWiki MC096 drawing](https://www.lcdwiki.com/0.96inch_OLED_Module_SKU:MC096VX) (similar module; YouKeyi unmeasured) | |
| HC-SR04 corner holes | 2 mm, 41 × 16 centre spacing | Generic module drawings (HNX unmeasured) | |
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
| ZC shield outline and mounting holes | | |
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
proportions (V9 assembled height 117.5; this head is 24 mm taller for the
electronics, so 141.5) but are prototype allowances, not measurements of the purchased parts:

- Head 63.5 wide × 61 tall × 69.5 deep including the 2 mm back cover, the same for every mouth.
  Its bottom 3 mm band (63.5 deep from the face) drops inside the body; behind the band the head
  rests on the body's rear rim. The face plane is unchanged; the extra 6 mm depth is at the rear. Body 68×68×38 with 3 mm chamfered vertical edges, cavity 64×64.
  Leg 16.5×29×38.5; foot sole 40×62×5 with front/rear brackets, sitting 10 mm outboard of the leg.
- Four MG90S servos: two hip servos stand shaft-down on the body floor at X ±22 (posts carry the ears,
  the shaft passes the floor into the leg's horn recess); one ankle servo inside each leg, shaft forward,
  driving a horn recessed in the foot's front bracket, with a Ø2.5 pivot pin through the rear bracket.
- Head prints face-down with open underside and rear. HC-SR04 eyes at X ±13.25, Y −15 from the head
  top, Ø16.5 holes; its 4-pin header points down, plugs hang 20 mm below the board. Nose Ø6 at Y −30,
  OLED window centre Y −40 (mouth 1) or three grille slots (mouth 2).
- OLED mounts upside down (header at the bottom edge) so its rear plugs pass 4 mm under the HC-SR04
  plugs; rotate the display 180° in software. With the header at the top the two sets of plugs
  crossed (12 × 5 × 4.5 mm), found by the Nov 1 fit check.
- Nano I/O shield stands upright, 42 wide × 60 tall, PCB back 6.75 mm in front of the back cover, top
  edge 3.5 mm under the head top (clears the dome's rounded ceiling). The stack in front reaches
  y −1 in the assembled frame, 2.25 mm behind the OLED plugs. Its lower 5 mm sits in the body in front of the
  rear wall, 2.5 mm above the battery holder. Two Ø6 cover posts with Ø2.5 pilots take its top holes;
  the bottom holes sit below the body rim and are unused.
- The Nano's Type-C port points up; a 12.85 × 7.0 slot with a 45° rear gable passes through the head top.
  The old rails could not take a Nano with soldered headers (pin rows hit the rail lips), so they are gone.
- Back cover: U-shaped 3 mm lip and the two shield posts; it stops at the body rim.
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
- Provisional USB opening 12.85×7.0 at clearance 0.25. The real plastic cable boot may be larger.
- Face mounts: four Ø3.5 posts from the face plate carry the HC-SR04 board, ending in Ø1.7 pins through
  its corner holes. With the OLED mouth, four Ø3.5 posts the glass thickness tall (1.5) carry the OLED
  PCB, with Ø1.6 pilots for M2 × 4 self-tapping screws (0.6 mm of face plate left in front).
  The OLED PCB centre sits 2.1 above the window so the upside-down active area stays centred in it.
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
| Eye ring | Actual HC-SR04 eye fits and stays retained | pending | | |
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
