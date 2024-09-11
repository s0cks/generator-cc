#include <glog/logging.h>
#include <gflags/gflags.h>
#include <benchmark/benchmark.h>

#include "<%= main_header_path %>"

int main(int argc, char** argv) {
  ::google::ParseCommandLineFlags(&argc, &argv, true);
  ::google::InitGoogleLogging(argv[0]);
  ::benchmark::Initialize(&argc, argv);
  ::benchmark::RunSpecifiedBenchmarks();
  ::benchmark::Shutdown();
  return EXIT_SUCCESS;
}