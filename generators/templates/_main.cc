#include <cstdlib>
#include <glog/logging.h>
#include <gflags/gflags.h>

#include "<%= project_name %>/<%= project_name %>.h"

auto main(int argc, char** argv) -> int {
  ::google::InitGoogleLogging(argv[0]);
  gflags::SetVersionString(<%= namespace %>::GetVersion().c_str());
  ::google::ParseCommandLineFlags(&argc, &argv, true);
  LOG(INFO) << "Running <%= project_name %> v" << <%= namespace %>::GetVersion() << "....";
  LOG(INFO) << "Hello World";
  return EXIT_SUCCESS;
}