#include <glog/logging.h>
#include <gflags/gflags.h>
#include <benchmark/benchmark.h>

#include "<%= main_header_path %>"

<%_ switch(standard) {
    case `03`:
    case `11`: -%>
int main(int argc, char** argv) {
<%_    break;
    default: -%>
auto main(int argc, char** argv) -> int {
   <%_ break;
} -%>
  ::google::ParseCommandLineFlags(&argc, &argv, true);
  ::google::InitGoogleLogging(argv[0]); // NOLINT(cppcoreguidelines-pro-bounds-pointer-arithmetic)
  ::benchmark::Initialize(&argc, argv);
  ::benchmark::RunSpecifiedBenchmarks();
  ::benchmark::Shutdown();
  return EXIT_SUCCESS;
}