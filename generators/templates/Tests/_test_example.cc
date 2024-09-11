#include <gtest/gtest.h>
#include <glog/logging.h>
#include "<%= main_header_path %>"

namespace <% namespace %> {
  using namespace ::testing;

  class ExampleTest : public Test {
  protected:
    ExampleTest() = default;
  public:
    ~ExampleTest() override = default;
  };

  TEST_F(ExampleTest, Test) {
    DLOG(INFO) << "Hello World";
  }
}