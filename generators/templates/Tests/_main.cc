#include <gtest/gtest.h>
#include <glog/logging.h>
#include "<%= project_name  %>/<%= project_name %>.h"

int main(int argc, char** argv) {
  ::google::InitGoogleLogging(argv[0]);
  ::testing::InitGoogleTest(&argc, argv);
  ::google::ParseCommandLineFlags(&argc, &argv, false);
  LOG(INFO) << "Running unit tests for <%= project_name %> v" << <%= project_name %>::GetVersion() << "....";
  return RUN_ALL_TESTS();
}