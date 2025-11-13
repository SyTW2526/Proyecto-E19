// .stylelintrc.cjs
module.exports = {
  extends: [
    "stylelint-config-standard",
    "stylelint-config-tailwindcss"
  ],
  rules: {
    // Asegura no dar error por at-rules desconocidas
    "at-rule-no-unknown": [true, {
      "ignoreAtRules": [
        "tailwind",
        "apply",
        "variants",
        "responsive",
        "screen",
        "layer",
        "config"
      ]
    }]
  }
}
