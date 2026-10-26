const turbs = gsap.utils.toArray(
  "#ink-lg feTurbulence, #ink-md feTurbulence, #ink-sm feTurbulence"
);

const mm = gsap.matchMedia();

mm.add("(prefers-reduced-motion: no-preference)", () => {
  // tremolio: il seed passa da 4 a 40 a gradini, 10 cambi al secondo
  const shake = gsap.to(turbs, {
    attr: { seed: 40 },
    duration: 40 / 10,
    ease: "steps(40)",
    repeat: -1,
  });

  // bonus: all'ingresso i bordi sono molto rovinati e si "assestano"
  gsap.from("#ink-lg feDisplacementMap", {
    attr: { scale: 10 },
    duration: 0.9,
    ease: "power2.out",
  });

  // cleanup
  return () => shake.kill();
});