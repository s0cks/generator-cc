#include <gtest/gtest.h>
#include <glog/logging.h>
#include "<%= main_header_path %>"

int main(int argc, char** argv) {
  ::google::InitGoogleLogging(argv[0]);
  ::testing::InitGoogleTest(&argc, argv);
  ::google::ParseCommandLineFlags(&argc, &argv, false);
  LOG(INFO) << "Running unit tests for <%= project_name %> v" << <%= namespace %>::GetVersion() << "....";
  return RUN_ALL_TESTS();
}