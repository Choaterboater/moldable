# Moldable Otto library

**Prototype, not V13-fit-certified.** The original CAD could not be downloaded
(Printables HTTP 403). This is newly authored geometry with explicitly recorded
prototype allowances. Do not treat an empty component intersection as proof that
an actual robot assembles or walks. See [fit record](../../../docs/reference/otto-fit.md).

## Attribution and license

Otto DIY by **Camilo Parra Palacio and the Otto DIY team / HP Robots**:
https://www.ottodiy.com and https://www.printables.com/model/31955 .
Martin Perdeaux's modular Otto is a styling reference:
https://www.printables.com/model/230575 . No modular source files were copied.

Otto design-resource licensing is stated in the upstream project's README:
https://github.com/OttoDIY/OttoDIYLib/blob/f384c00a641e11c8741487320c6f1d82ad72e6d5/README.md#license-cc-by-sa
It explicitly links **Creative Commons Attribution-ShareAlike 4.0 International**.
This is separate from the GPL-3.0 license of the Arduino firmware library.
Printables' individual model terms could not be inspected; no blocked asset was bundled.

The new Moldable Otto SCAD files and their exported Otto geometry are offered
under **CC-BY-SA-4.0**. Keep attribution, identify changes, link the license and
share adaptations under the same license. This does not license unrelated
Moldable code or resolve the repository's other third-party licensing questions.

- License summary: https://creativecommons.org/licenses/by-sa/4.0/
- Legal code: https://creativecommons.org/licenses/by-sa/4.0/legalcode.en

## Files

- `otto_fit.scad`: fixed reference sizes and explicitly provisional design positions.
- `otto_core.scad`: cavities, top Type-C slot, shield clips, buzzer seat and five fit-test samples.
- `otto_shells.scad`: six parts, exterior styles and nonoverlapping plate layout.

All modules accept parameters explicitly; built-in templates use the existing
library-file loader. Downloaded SCAD is flattened only at the export boundary
so the downloaded file works without hidden browser libraries. STL exports carry
an 80-byte credit/license header; keep this README and source with redistributions.

## Changelog

- Initial Moldable prototype: fixed core, four head styles, ears/antenna/hats,
  three mouth and feet styles, fit samples and H2C volume validation.
- Access channels remain open toward print-up; horn and socket transitions taper
  rather than introducing unsupported internal ceilings.
- Physical measurements, V13 articulation comparison and real prints pending.
- Electronics fit (Nov 2026): head 61 tall for every mouth and 6 mm deeper at the rear;
  Nano rails replaced by an upright I/O shield on back-cover posts with the Type-C slot
  in the head top; OLED mounted upside down; buzzer moved to the body floor;
  ankle-servo ear
  seats and buzzer crush ribs.
- Power: 4×AA NiMH two-layer holder between the hip servos (replaces the 9 V cell);
  KCD11 rocker switch at the front right of the floor.
- Face mounts (Nov 9): HC-SR04 and OLED held by edge guides with snap ridges instead of
  hole posts; eyes 27.2 mm apart and 5 mm proud of the face.
- Shield (Nov 9): modelled from the user's calipers (blue Nano IO shield V3.0, 53.2 × 54.8)
  and held by cover clips instead of posts; head 62 tall so its corners clear every style.
- Joints and latch (Nov 10): the fit dummies now include the servo boss, spline and horn, which showed the
  hip and ankle could not be assembled. Leg gaps 3 mm (hip) and 2.5 mm (ankle); open-top keyhole in the foot's
  front bracket; horn screws bear on the horns through head-sized holes; servo ear screws as ankle pivots;
  lead slots in the body floor and leg; leg bottom rounded for ±30° roll; snap ridges hold the back cover.
  Head snaps onto the body rim; Type-C hole enlarged to 14.5 × 8.5.
- Measured servo (Nov 10): the user's ASKY MG90S is 24.17 tall to the flat top, not 22.7, so the leg cavity,
  ear seats, hip gap (4 mm) and foot bracket (5.4) follow the calipers and the seller's drawing. The ankle
  servo's cable now leaves through a plug-sized window high in the leg's rear wall. Robot height 147.
- Board raised 3.5 mm on the back cover (Nov 10) so the Type-C port sits 3.25 mm under the head top instead of
  6.75; bevel corners capped at 8 mm, dome 13 mm.
- Back cover pinned by two servo ear screws through the head's side walls into posts on the cover (Nov 10):
  friction ribs and the snap ridge did not hold on the builder's printer. Drill guide for earlier heads is
  otto_coupon(5) (otto-cover-drill-guide.stl).
- Legs and feet rebuilt on the official Otto DIY V13 leg (Nov 11): two legs of our own layout did not take the
  builder's servo; the official leg and feet did (MakerWorld 1307980, CC BY-SA), once the servo arm was cut down.
  Leg 17 × 35 × 42 with V13's 13 × 31 bay, ear block and closed end, measured from that mesh; hip horn inside the
  leg under a 2.5 mm plate; horn pockets take the arm uncut; ear-screw slot instead of a hole; servo-screw rear
  pivot; switch moved 1.5 mm forward for the longer leg. Robot height 149.5. The official V13 leg also fits this
  body. Fit-test prints: otto_fit_cut(0) half a leg, otto_fit_cut(1) one hip station. Details: docs/reference/otto-fit.md.
- Rear ankle pivot is a printed knob again (Nov 12): the servo-screw pivot went in where the ankle servo's cable
  runs. A round pin on the leg's rear wall now clicks into a dimple in the foot's rear bracket, as on V13. Also
  from V13, at the builder's request: finger windows in both sides of the leg under the top plate, and a slot
  for an extra screw into the horn's arm at the hip (leg top plate) and at the ankle (front bracket; a short
  screw, 6 mm of thread at most), and the ankle servo's cable leaves the leg through its top into a window in
  the body floor in front of the hip servo (buzzer moved 3.5 mm forward for it). Legs and feet printed from the Nov 11 version do not mix with these.
- Head-to-body clip copied from V13 (Nov 12): a tab with a 1.3 mm barb below each head side wall, a groove 6 mm
  under the body rim with a bump outside it, and two seats under the front of the head. It replaces the 0.45 mm
  ridge. A head or body printed before this does not clip to the new counterpart.
