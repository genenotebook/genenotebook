import {pi} from "../math";
import projection from "./index";

export function equirectangular(lambda, phi) {
  return [lambda, phi];
}

equirectangular.invert = equirectangular;

export default function() {
  return projection(equirectangular).scale(480 / pi);
}
