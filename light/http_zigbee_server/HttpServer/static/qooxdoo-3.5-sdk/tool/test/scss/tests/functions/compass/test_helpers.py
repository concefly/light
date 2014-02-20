"""Tests for the Compass helper functions.

Not all of Compass is implemented, and the arrangement of Compass functions
doesn't exactly match the arrangement in the original documentation.
Regardless, this is a good starting place:

http://compass-style.org/reference/compass/helpers/

Some functions appear to be undocumented, but nonetheless are part of Compass's
Ruby code.
"""

from scss.expression import Calculator
from scss.functions.compass.helpers import COMPASS_HELPERS_LIBRARY
from scss.rule import Namespace


import pytest
from scss import config
import os
from _pytest.monkeypatch import monkeypatch
xfail = pytest.mark.xfail

# TODO many of these tests could also stand to test for failure cases

config.PROJECT_ROOT = os.path.normpath(os.path.dirname(os.path.abspath(__file__ + '/../../../')))

@pytest.fixture
def calc():
    ns = Namespace(functions=COMPASS_HELPERS_LIBRARY)
    return Calculator(ns).evaluate_expression


# ------------------------------------------------------------------------------
# Listish functions
# See: http://ruby-doc.org/gems/docs/c/compass-0.12.2/Compass/SassExtensions/Functions/Lists.html

def test_blank(calc):
    assert calc('blank(false)')
    assert calc('blank("")')
    assert calc('blank(" ")')
    # TODO this is a syntax error; see #166
    #assert calc('blank(())')

    assert not calc('blank(null)')  # yes, really
    assert not calc('blank(1)')
    assert not calc('blank((1, 2))')
    assert not calc('blank(0)')


def test_compact(calc):
    assert calc('compact(1 2 3 false 4 5 null 6 7)') == calc('1 2 3 4 5 6 7')


def test_reject(calc):
    assert calc('reject(a b c d, a, c)') == calc('b d')
    assert calc('reject(a b c d, e)') == calc('a b c d')


def test_first_value_of(calc):
    assert calc('first-value-of(a b c d)') == calc('a')
    assert calc('first-value-of("a b c d")') == calc('"a"')

# -compass-list

# -compass-space-list

# -compass-slice


## Property prefixing

# prefixed

# prefix

# -moz...


## Selector generation

# append-selector

# elements-of-type

def test_enumerate(calc):
    assert calc('enumerate(foo, 4, 7)') == calc('foo-4, foo-5, foo-6, foo-7')
    assert calc('enumerate("bar", 8, 10)') == calc('bar-8, bar-9, bar-10')


def test_headings(calc):
    assert calc('headings()') == calc('h1, h2, h3, h4, h5, h6')
    assert calc('headings(all)') == calc('h1, h2, h3, h4, h5, h6')
    assert calc('headings(2)') == calc('h1, h2')
    assert calc('headings(2, 5)') == calc('h2, h3, h4, h5')


def test_nest(calc):
    # Using .render() here because the structure is complicated and only the
    # output matters
    assert calc('nest(selector1, selector2, selector3)').render() == 'selector1 selector2 selector3'
    assert calc('nest("a b", "c d")').render() == 'a b c d'
    assert calc('nest((a, b), (c, d))').render() == 'a c, a d, b c, b d'


# range


## Working with CSS constants

# position

def test_opposite_position(calc):
    assert calc('opposite-position(left)') == calc('right')
    assert calc('opposite-position(top)') == calc('bottom')
    assert calc('opposite-position(center)') == calc('center')
    assert calc('opposite-position(top left)') == calc('bottom right')
    assert calc('opposite-position(center right)') == calc('center left')


## Math

def test_pi(calc):
    assert calc('pi()') == calc('3.141592653589793')


def test_e(calc):
    assert calc('e()') == calc('2.718281828459045')


def test_sqrt(calc):
    assert calc('sqrt(9)') == calc('3')


def test_log(calc):
    assert calc('log(9, 3)') == calc('2')


def test_pow(calc):
    assert calc('pow(3, 2)') == calc('9')
    assert calc('pow(10px, 2) / 1px') == calc('100px')


# sin

# cos

# tan


## Fonts
# font-url
def test_font_url(calc):
    # nb: config.FONTS_URL is None and defaults to this
    fonts_url = config.STATIC_URL
    assert calc('font-url("/some_path.woff")').render() == 'url({0}some_path.woff)'.format(fonts_url)
    assert calc('font-url("/some_path.woff") format("woff")').render() == 'url({0}some_path.woff) format("woff")'.format(fonts_url)


# font-files
def test_font_files(calc):
    """
    @author: funvit
    @note: adapted from  compass / test / units / sass_extensions_test.rb
    """
    # nb: config.FONTS_URL is None and defaults to this
    fonts_url = config.STATIC_URL
    assert '' == calc('font-files()').render()
    assert 'url({0}font/name.woff) format("woff"), url({0}fonts/name.ttf) format("truetype"), url({0}fonts/name.svg#fontpath) format("svg")'.format(fonts_url) == calc('font-files("/font/name.woff", woff, "/fonts/name.ttf", truetype, "/fonts/name.svg#fontpath", svg)').render()

    assert 'url({0}font/with/right_ext.woff) format("woff")'.format(fonts_url) == calc('font_files("/font/with/right_ext.woff")').render()
    assert 'url({0}font/with/wrong_ext.woff) format("svg")'.format(fonts_url) == calc('font_files("/font/with/wrong_ext.woff", "svg")').render()
    assert 'url({0}font/with/no_ext) format("opentype")'.format(fonts_url) == calc('font_files("/font/with/no_ext", "otf")').render()
    assert 'url({0}font/with/weird.ext) format("truetype")'.format(fonts_url) == calc('font_files("/font/with/weird.ext", "truetype")').render()

    assert 'url({0}font/with/right_ext.woff) format("woff"), url({0}font/with/right_ext_also.otf) format("opentype")'.format(fonts_url) == calc('font_files("/font/with/right_ext.woff", "/font/with/right_ext_also.otf")').render()
    assert 'url({0}font/with/wrong_ext.woff) format("truetype"), url({0}font/with/right_ext.otf) format("opentype")'.format(fonts_url) == calc('font_files("/font/with/wrong_ext.woff", "ttf", "/font/with/right_ext.otf")').render()


# inline-font-files
def test_inline_font_files(calc):
    """
    @author: funvit
    @note: adapted from  compass / test / units / sass_extensions_test.rb
    """
    monkeypatch().setattr(config, 'FONTS_ROOT', os.path.join(config.PROJECT_ROOT, 'tests/files/fonts'))

    with open(os.path.join(config.PROJECT_ROOT, 'tests/files/fonts/bgrove.base64.txt'), 'r') as f:
        font_base64 = ''.join((f.readlines()))

    assert 'url(data:font/truetype;base64,%s) format("truetype")' % font_base64 == calc('inline_font_files("/bgrove.ttf", truetype)').render()


## External stylesheets

# stylesheet-url
