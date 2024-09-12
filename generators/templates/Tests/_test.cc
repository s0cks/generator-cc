#include <gtest/gtest.h>
#include <glog/logging.h>
#include "<%= main_header_path %>"
#include "<%= test_header_path %>"

namespace <%= namespace %> {
  using namespace ::testing;

  TEST_F(<%= test_name %>, Test) {
    DLOG(INFO) << "Hello World";
  }
}