#include <cstdlib>
#include <glog/logging.h>
#include <gflags/gflags.h>

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
  ::google::InitGoogleLogging(argv[0]); // NOLINT(cppcoreguidelines-pro-bounds-pointer-arithmetic)
  gflags::SetVersionString(<%= namespace %>::GetVersion().c_str());
  ::google::ParseCommandLineFlags(&argc, &argv, true);
  LOG(INFO) << "Running <%= project_name %> v" << <%= namespace %>::GetVersion() << "....";
  LOG(INFO) << "Hello World";
  return EXIT_SUCCESS;
}