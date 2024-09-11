#ifdef <%= prefix %>_DEBUG
#define NDEBUG 1
#endif // <%= prefix %>_DEBUG

#include <cstdlib>
#include <glog/logging.h>
#include <gflags/gflags.h>

#include "<%= project_name %>/<%= project_name %>.h"

using namespace <%= namespace %>;

auto main(int argc, char** argv) -> int {
  ::google::InitGoogleLogging(argv[0]);
  gflags::SetVersionString(<%= namespace %>::GetVersion().c_str());
  ::google::ParseCommandLineFlags(&argc, &argv, true);
  DLOG(INFO) << "v" << <%= namespace %>::GetVersion();
  DLOG(INFO) << "Hello World";
  return EXIT_SUCCESS;
}