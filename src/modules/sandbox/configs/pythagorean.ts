import { SandboxConfig } from "../SandboxRenderer";

export const pythagoreanConfig: SandboxConfig = {
  sandbox_id: "SB-KP023",
  canvas_template: "pythagorean_proof_template",
  viewbox_spec_json: "{\"xMin\":-6,\"xMax\":6,\"yMin\":-6,\"yMax\":6,\"marginPercent\":15}",
  drag_points_json: "[{\"id\":\"C\",\"x\":0,\"y\":3,\"constrainTo\":\"circle_diameter\",\"constraints\":{\"minY\":-3,\"maxY\":3,\"stepY\":0.1}}]",
  param_sliders_json: "[{\"id\":\"angle\",\"name\":\"angle\",\"min\":10,\"max\":80,\"default\":36.87,\"step\":0.1}]",
  invariants_display_json: "{\"labelZh\":\"面积守恒\",\"formula\":\"a^2 + b^2 = c^2\"}",
};
