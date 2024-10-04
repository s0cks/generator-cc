#include <gtest/gtest.h>
#include <glog/logging.h>
#include "<%= test_header_path %>"

namespace <%= namespace %> {
  using namespace ::testing;

  TEST_F(<%= test_name %>, Test) { // NOLINT
    DLOG(INFO) << "Hello World";
  }
}