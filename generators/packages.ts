export interface Package {
  name: string;
  vcpkg?: string;
  version?: string;
  required?: boolean;
  link: Array<string>;
};

export type PackageList = Array<Package>;

export const TEST_PACKAGES: PackageList = [
  {
    name: `GTest`,
    required: true,
    vcpkg: "gtest",
    link: [
      "GTest::gtest",
      "GTest::gmock"
    ]
  },
];

export const BENCHMARK_PACKAGES: PackageList = [
  {
    name: `benchmark`,
    vcpkg: "benchmark",
    required: true,
    link: [
    "benchmark::benchmark"
    ]
  },
];

export const DEFAULT_PACKAGES: PackageList = [
  {
    name: `Threads`,
    required: true,
    link: [
      "Threads::Threads"
    ],
  }
];