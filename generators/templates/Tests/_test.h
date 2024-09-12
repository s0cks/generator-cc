#ifndef <%= header_prefix %>_TEST_H
#define <%= header_prefix %>_TEST_H

#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include <glog/logging.h>
#include "<%= main_header_path %>"

namespace <%= namespace %> {
  using namespace ::testing;

  class <%= test_name %> : public Test {
  protected:
    <%= test_name %>() = default;
  public:
    ~<%= test_name %>() override = default;
  };
}

#endif // <%= header_prefix %>_TEST_H