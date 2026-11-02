# Otto Robot

Find **Classic Otto**, **Rounded Otto** and **Cat-ear Otto** in the gallery, or type
“otto robot”, “make me a dancing robot” or “lego otto”. The model category is Robots.
Use the **Show** buttons to pick Assembled, Head, Back cover, Body, Leg L, Leg R, Foot L, Foot R or Print plate. Otto opens on Assembled, a look-only view of the whole robot (STL download is disabled there); every part sits on its real interface: feet on the ground, legs between the foot brackets, hip horns just under the body floor, head dropped 3 mm into the body (its rear rests on the body rim) and the cover flush at the rear. The Front/Back/Side/Top buttons in the viewer jump to fixed angles.
Use **Paint** to pick Whole robot, Head, Back cover, Body, Legs or Feet, then click a color swatch. Each Paint button shows a dot in that part's current color, which tells it apart from the Show buttons of the same name; the Assembled view and single-part views show each part in its own color. Colors are preview only (not saved with designs or links); choose one filament color per part in the slicer.

## Prototype status

This build follows Otto V9's look and proportions but is not a verified V9 or V13 replacement. Original STEP/Fusion downloads
were blocked, and the purchased components have not been measured here. Shape
changes preserve the coded core, **not a guarantee of purchased-hardware fit**.
In particular shield mounting, sensor retention, horn/servo axes and assembly
interfaces need comparison with the original CAD and hardware before full prints.
See [dimensions and acceptance record](../reference/otto-fit.md).

## Hardware target

HNX Type-C Nano with soldered headers; ZC Nano I/O shield; four ASKY MG90S 180°
servos; HC-SR04; 0.96-inch I2C OLED; 5 V passive buzzer; rechargeable 9 V battery,
clip-to-5.5×2.1 mm lead, panel power connection and switch. The purchased-product
links are recorded in the fit record without assuming their contents.

## Exterior settings

Head: cube, rounded, bevel or dome. Corners: 0–12 mm. Shell growth:
0–10 mm per side. Ears: none, round, cat or bear. Antenna: 0–30 mm. Hats: none,
cap, top hat or helmet. Mouth: classic nose hole (default), OLED window, or grille. Every mouth uses the same 61 mm tall head: the electronics need that room. Feet: classic, boot or
wide stable. These do not change component positions. Core interfaces are not sliders.

## Print the small fit tests first

Use the four buttons on an Otto result to download standalone `.scad` files.
Open them in OpenSCAD and export STL, then slice in Bambu Studio. They are small
sample pockets/openings, sometimes called **coupons**, not the printer's corners.

1. Servo pocket: insert the actual MG90S by hand; it should be snug without force.
2. Sensor eye ring: check the actual transducer fits and remains retained.
3. Type-C opening: check the actual cable boot, then verify insertion with the Nano
   in the shield on the back cover. The cable now enters through the **top of the
   head**. The opening sample alone cannot verify port position.
4. Battery bay: check actual cell, clip and wire, then verify closure in the measured
   assembly. A bare standard 9 V envelope is not an actual rechargeable-cell test.

Fit clearance starts at **0.25 mm per side**. It is the extra room around hardware,
not printer bed clearance. Adjust in **0.05 mm** steps within **0.1–0.5 mm** and
record each outcome. The final default is not validated until all four checks pass.

## H2C and print settings

Select the actual nozzle mode in Settings → Printer. Official printable W×D×H:

| Mode | mm |
|---|---|
| Single left | 325×320×320 |
| Single right | 305×320×325 |
| Dual | 300×320×320 |

Source: https://bambulab.com/en/h2c/specs . Do not substitute the combined
330×320×320 two-nozzle volume. Existing saved printer choices are preserved.
New sessions default to H2C dual. Plate checks include height and do not silently
rotate a laid-out plate. Oversize Otto plates show “Otto plate exceeds the selected
printer volume — print parts one at a time.”

Start slicing at **0.2 mm layers, 3 walls, 15% infill, no supports**. Head prints
face-down (eyes and screen on the bed) with its underside and rear open; the back cover prints outside-face down; body prints floor-down, legs top-down, feet sole-down. Decorations are
flat-backed extensions in the same printable part, not separately colored pieces.
The analytic 45° check excludes bed-contact faces; real support-free acceptance
still requires actual slicing and prints. Keep the generated orientation.

## Electronics layout

All of this is coded from reference sizes, not measured parts. See the fit record.

- **Nano + I/O shield:** the shield stands upright on two posts on the back cover
  (M3 self-tapping screws through its two top holes), Nano and plugs facing the face.
  The Nano's Type-C port points up, and the cable plugs in through a slot in the head
  top. The shield's bottom edge reaches about 5 mm into the body, in front of the
  body's rear wall. The bottom holes are not used.
- **HC-SR04:** its eyes sit in the eye holes. Four posts on the inside of the face end in
  pins that go through the board's corner holes; melt the pin tips with a soldering iron
  or add a drop of glue. Its plugs hang straight down behind the OLED.
- **OLED (OLED mouth):** mount it **upside down** (pin header at the bottom) so its plugs
  pass under the HC-SR04 plugs. Its glass sits against the inside of the face and four
  short posts carry the board: fix it with four **M2 × 4 mm** self-tapping screws from
  behind. Rotate the display 180° in the sketch, for example `U8G2_R2` (U8g2) or
  `display.setRotation(2)` (Adafruit SSD1306).
- **Wiring:** Dupont jumpers to the shield. HC-SR04 Trig D8, Echo D9 (Otto examples);
  OLED SDA A4, SCL A5; both to 5 V and GND. Check the OLED's VCC/GND labels: some swap them.
- **Buzzer:** sits sound-side down in a ring on the body floor, front left; it sounds
  through a floor hole.
- **Order:** screw the shield to the cover; plug the sensor, OLED, buzzer, servo and
  battery leads into it; slide the cover into the head; then drop the head into the body. To open it again, lift the head
  out of the body first: the shield's lower edge sits behind the body's rear wall.

## Assembly and calibration

After dimensional review and all four fit checks, print each default part and
record its support-free result separately. Compare head/body mating, servo shaft
axes, horn seating, board access and wire routing with the original V13 CAD/manual
before attaching hardware. The prototype currently cannot certify those interfaces.
Do not infer articulation or walking from watertight meshes.

- Original CAD/manual starting point: https://www.printables.com/model/31955
- Original Otto design links: https://www.ottodiy.com/design
- Arduino library: https://github.com/OttoDIY/OttoDIYLib (Arduino Library Manager: `OttoDIYLib`).
- Calibration: https://github.com/OttoDIY/OttoDIYCalibration ; current library also
  documents its `Otto_CalibrationWalk` example.

Once mechanical and electrical review is complete, center/calibrate servos before
securing horns following those upstream instructions. Power validation and powered
walking trials are explicitly deferred, not reported as passed here.

## Exports and credits

STL contains the same single-color geometry with an Otto DIY / CC-BY-SA-4.0 credit
header. SCAD downloads are standalone, carry full attribution/license links and
retain the fixed-core design. This checkout has no 3MF exporter; adding multi-color
3MF is not part of this build. Keep attribution and source with shared geometry.
See [library licensing](../../cad/libraries/otto/README.md).
