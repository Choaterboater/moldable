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
  hole posts; eyes 27.0 mm apart and 5 mm proud of the face.
- Shield (Nov 9): modelled from the user's calipers (blue Nano IO shield V3.0, 53.2 × 54.8)
  and held by cover clips instead of posts; head 62 tall so its corners clear every style.
