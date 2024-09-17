#include <gtest/gtest.h>
#include <glog/logging.h>
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
  ::testing::InitGoogleTest(&argc, argv);
  ::google::ParseCommandLineFlags(&argc, &argv, false);
  LOG(INFO) << "Running unit tests for <%= project_name %> v" << <%= namespace %>::GetVersion() << "....";
  return RUN_ALL_TESTS();
}