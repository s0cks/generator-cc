#ifndef <%= test_header_guard %>
#define <%= test_header_guard %>

#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include <glog/logging.h>
#include "<%= main_header_path %>"

namespace <%= namespace %> {
  using namespace ::testing;

  class <%= test_name %> : public Test { // NOLINT
  protected:
    <%= test_name %>() = default;
  public:
    ~<%= test_name %>() override = default;
  };
}

#endif  // <%= test_header_guard %>